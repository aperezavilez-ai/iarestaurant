import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { QROrder, QROrderItem, WaiterAlert, ValidationMode } from '@/types/qrFlow'
import { qrFlowService } from '@/services/qrFlowService'
import { qrFlowRepository } from '@/repositories/qrFlowRepository'
import { isSupabaseConfigured } from '@/lib/config'

const CHANNEL_NAME = 'ia-restaurant-live-flow'
let channel: BroadcastChannel | null = null

function getChannel() {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME)
  return channel
}

function broadcast() {
  getChannel()?.postMessage({ type: 'sync', ts: Date.now() })
}

interface LiveFlowState {
  validationMode: ValidationMode
  qrOrders: QROrder[]
  waiterAlerts: WaiterAlert[]
  remoteSynced: boolean
  hydrateFromRemote: () => Promise<void>
  setValidationMode: (mode: ValidationMode) => Promise<void>
  submitQROrder: (params: {
    table_id: string
    table_number: number
    area: string
    waiter_id: string
    waiter_name: string
    items: QROrderItem[]
  }) => Promise<QROrder>
  validateQROrder: (orderId: string) => Promise<void>
  rejectQROrder: (orderId: string, reason?: string) => Promise<void>
  updateQROrderStatus: (orderId: string, status: QROrder['status']) => Promise<void>
  addWaiterAlert: (alert: Omit<WaiterAlert, 'id' | 'read' | 'created_at'>) => Promise<void>
  dismissAlert: (alertId: string) => Promise<void>
  getOrderForTable: (tableNumber: number) => QROrder | undefined
  getPendingValidation: () => QROrder[]
  applyRemoteOrder: (order: QROrder) => void
  applyRemoteAlert: (alert: WaiterAlert) => void
}

export const useLiveFlowStore = create<LiveFlowState>()(
  persist(
    (set, get) => ({
      validationMode: 'validacion',
      qrOrders: [],
      waiterAlerts: [],
      remoteSynced: false,

      hydrateFromRemote: async () => {
        if (!isSupabaseConfigured()) return
        const [orders, alerts, mode] = await Promise.all([
          qrFlowRepository.fetchOrders(),
          qrFlowRepository.fetchAlerts(),
          qrFlowRepository.getValidationMode(),
        ])
        set({ qrOrders: orders, waiterAlerts: alerts, validationMode: mode, remoteSynced: true })
        broadcast()
      },

      setValidationMode: async (mode) => {
        set({ validationMode: mode })
        if (isSupabaseConfigured()) await qrFlowRepository.setValidationMode(mode)
        broadcast()
      },

      submitQROrder: async (params) => {
        const subtotal = params.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
        const tax = subtotal * 0.16
        const order: QROrder = {
          id: crypto.randomUUID(),
          table_id: params.table_id,
          table_number: params.table_number,
          area: params.area,
          waiter_id: params.waiter_id,
          waiter_name: params.waiter_name,
          items: params.items,
          status: 'enviado',
          subtotal,
          tax,
          total: subtotal + tax,
          folio: qrFlowService.generateFolio(),
          created_at: new Date().toISOString(),
        }

        if (isSupabaseConfigured()) await qrFlowRepository.insertOrder(order)
        set(s => ({ qrOrders: [order, ...s.qrOrders] }))

        await get().addWaiterAlert({
          type: 'nuevo_pedido_qr',
          table_number: params.table_number,
          order_id: order.id,
          message: `Mesa ${params.table_number} pidió por QR — ${params.items.length} productos · ${order.folio}`,
        })

        if (get().validationMode === 'automatico') {
          await get().validateQROrder(order.id)
        } else {
          broadcast()
        }

        return order
      },

      validateQROrder: async (orderId) => {
        const order = get().qrOrders.find(o => o.id === orderId)
        if (!order || order.status !== 'enviado') return

        const kitchenOrderId = await qrFlowService.pushToKitchen(order)
        const now = new Date().toISOString()
        const patch = { status: 'en_preparacion' as const, validated_at: now, kitchen_order_id: kitchenOrderId }

        if (isSupabaseConfigured()) await qrFlowRepository.updateOrder(orderId, patch)

        set(s => ({
          qrOrders: s.qrOrders.map(o => o.id === orderId ? { ...o, ...patch } : o),
        }))

        await get().addWaiterAlert({
          type: 'pedido_validado',
          table_number: order.table_number,
          order_id: orderId,
          message: `Pedido QR validado — Mesa ${order.table_number} enviado a cocina`,
        })

        broadcast()
      },

      rejectQROrder: async (orderId, reason) => {
        const order = get().qrOrders.find(o => o.id === orderId)
        if (!order) return

        const patch = { status: 'rechazado' as const, rejected_reason: reason }
        if (isSupabaseConfigured()) await qrFlowRepository.updateOrder(orderId, patch)

        set(s => ({
          qrOrders: s.qrOrders.map(o => o.id === orderId ? { ...o, ...patch } : o),
        }))

        await get().addWaiterAlert({
          type: 'nuevo_pedido_qr',
          table_number: order.table_number,
          order_id: orderId,
          message: `Pedido QR rechazado — Mesa ${order.table_number}${reason ? `: ${reason}` : ''}`,
        })

        broadcast()
      },

      updateQROrderStatus: async (orderId, status) => {
        if (isSupabaseConfigured()) await qrFlowRepository.updateOrder(orderId, { status })
        set(s => ({
          qrOrders: s.qrOrders.map(o => o.id === orderId ? { ...o, status } : o),
        }))

        const order = get().qrOrders.find(o => o.id === orderId)
        if (status === 'listo' && order) {
          await get().addWaiterAlert({
            type: 'pedido_listo',
            table_number: order.table_number,
            order_id: orderId,
            message: `¡Pedido listo! Mesa ${order.table_number} — llevar a mesa`,
          })
        }

        broadcast()
      },

      addWaiterAlert: async (alert) => {
        const entry: WaiterAlert = {
          ...alert,
          id: crypto.randomUUID(),
          read: false,
          created_at: new Date().toISOString(),
        }
        if (isSupabaseConfigured()) await qrFlowRepository.insertAlert(entry)
        set(s => ({ waiterAlerts: [entry, ...s.waiterAlerts].slice(0, 50) }))
        broadcast()
      },

      dismissAlert: async (alertId) => {
        if (isSupabaseConfigured()) await qrFlowRepository.markAlertRead(alertId)
        set(s => ({
          waiterAlerts: s.waiterAlerts.map(a => a.id === alertId ? { ...a, read: true } : a),
        }))
        broadcast()
      },

      applyRemoteOrder: (order) => {
        set(s => {
          const exists = s.qrOrders.find(o => o.id === order.id)
          if (exists) {
            return { qrOrders: s.qrOrders.map(o => o.id === order.id ? order : o) }
          }
          return { qrOrders: [order, ...s.qrOrders] }
        })
        broadcast()
      },

      applyRemoteAlert: (alert) => {
        set(s => {
          const exists = s.waiterAlerts.find(a => a.id === alert.id)
          if (exists) {
            return { waiterAlerts: s.waiterAlerts.map(a => a.id === alert.id ? alert : a) }
          }
          return { waiterAlerts: [alert, ...s.waiterAlerts].slice(0, 50) }
        })
        broadcast()
      },

      getOrderForTable: (tableNumber) => {
        return get().qrOrders.find(o => o.table_number === tableNumber && !['entregado', 'rechazado'].includes(o.status))
      },

      getPendingValidation: () => get().qrOrders.filter(o => o.status === 'enviado'),
    }),
    {
      name: 'ia-restaurant-live-flow',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        validationMode: s.validationMode,
        qrOrders: s.qrOrders,
        waiterAlerts: s.waiterAlerts,
      }),
    }
  )
)

if (typeof window !== 'undefined') {
  getChannel()?.addEventListener('message', () => {
    useLiveFlowStore.persist.rehydrate()
  })
  window.addEventListener('storage', (e) => {
    if (e.key === 'ia-restaurant-live-flow') useLiveFlowStore.persist.rehydrate()
  })
}
