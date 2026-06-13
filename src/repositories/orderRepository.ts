import { orderService } from '@/services/orderService'
import { paymentService } from '@/services/paymentService'
import { tableService } from '@/services/tableService'
import { localDb } from '@/lib/localDb'
import { opsBroadcast } from '@/services/opsBroadcast'
import { inventoryRepository } from '@/repositories/inventoryRepository'
import { crmRepository } from '@/repositories/crmRepository'
import { withLocalFirst, withHybridList } from './base'
import { isSupabaseConfigured } from '@/lib/config'
import { generateFolio } from '@/lib/utils'
import { TAX_RATE } from '@/data/constants'
import type { Order, OrderItem, Payment, PaymentMethod, RestaurantTable } from '@/types'
import type { TenantContext } from '@/types/context'

async function pushOrderRemote(
  order: Order,
  items: OrderItem[],
  payments?: Payment[],
  tablePatch?: RestaurantTable
) {
  if (!isSupabaseConfigured()) return
  try {
    await orderService.createOrder(order, items)
    if (payments) {
      for (const p of payments) await paymentService.createPayment(p)
    }
    if (tablePatch) {
      await tableService.updateTableStatus(
        tablePatch.id,
        tablePatch.status,
        tablePatch.current_order_id
      )
    }
  } catch {
    await localDb.enqueueSync({ table: 'orders', operation: 'insert', payload: order as never })
    for (const item of items) {
      await localDb.enqueueSync({ table: 'order_items', operation: 'insert', payload: item as never })
    }
    if (payments) {
      for (const p of payments) {
        await localDb.enqueueSync({ table: 'payments', operation: 'insert', payload: p as never })
      }
    }
  }
}

export interface CartLine {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  notes?: string
}

export const orderRepository = {
  async getActiveOrders(ctx: TenantContext): Promise<Order[]> {
    const orders = await withHybridList(
      () => localDb.getActiveOrders(ctx.tenantId, ctx.sucursalId),
      () => orderService.getActiveOrders(ctx.tenantId, ctx.sucursalId)
    )
    return orders.filter((o) => o.status !== 'cobrada' && o.status !== 'cancelada')
  },

  async getAllOrders(ctx: TenantContext): Promise<Order[]> {
    return withHybridList(
      () => localDb.getOrders(ctx.tenantId, ctx.sucursalId),
      () => orderService.getOrderHistory(ctx.tenantId, ctx.sucursalId, 200)
    )
  },

  async createOrderWithPayment(
    ctx: TenantContext,
    lines: CartLine[],
    method: PaymentMethod,
    options?: {
      cashReceived?: number
      tableId?: string
      discount?: number
      guests?: number
      mixedCash?: number
      mixedCard?: number
      promoCode?: string
      customerId?: string
    }
  ): Promise<{ order: Order; payment: Payment; payments?: Payment[] }> {
    const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0)
    const discount = Math.min(subtotal, options?.discount ?? 0)
    const taxRate = ctx.taxRate ?? TAX_RATE
    const taxable = Math.max(0, subtotal - discount)
    const tax = taxable * taxRate
    const total = taxable + tax
    const folio = generateFolio()
    const orderId = crypto.randomUUID()
    const now = new Date().toISOString()

    const order: Order = {
      id: orderId,
      tenant_id: ctx.tenantId,
      sucursal_id: ctx.sucursalId,
      table_id: options?.tableId,
      folio,
      status: 'cobrada',
      cashier_id: ctx.userId,
      subtotal,
      tax,
      discount,
      total,
      guests: options?.guests ?? 1,
      notes: options?.promoCode ? `Promo: ${options.promoCode}` : undefined,
      created_at: now,
      updated_at: now,
    }

    const items: OrderItem[] = lines.map((l) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: l.product_id,
      product_name: l.product_name,
      quantity: l.quantity,
      unit_price: l.unit_price,
      subtotal: l.unit_price * l.quantity,
      notes: l.notes,
      status: 'entregado' as const,
    }))

    const change = method === 'efectivo' && options?.cashReceived
      ? Math.max(0, options.cashReceived - total)
      : 0

    const payments: Payment[] = []

    if (method === 'mixto' && options?.mixedCash != null && options?.mixedCard != null) {
      payments.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        tenant_id: ctx.tenantId,
        method: 'efectivo',
        amount: options.mixedCash,
        created_at: now,
        reference: 'mixto-efectivo',
      })
      payments.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        tenant_id: ctx.tenantId,
        method: 'tarjeta',
        amount: options.mixedCard,
        created_at: now,
        reference: 'mixto-tarjeta',
      })
    } else {
      payments.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        tenant_id: ctx.tenantId,
        method,
        amount: total,
        change_amount: change,
        created_at: now,
      })
    }

    const payment = payments[0]

    await localDb.saveOrder({ ...order, items }, items)
    for (const p of payments) await localDb.savePayment(p)
    await inventoryRepository.deductForOrder(ctx, lines, folio)
    if (options?.customerId) crmRepository.recordSale(options.customerId, total)
    opsBroadcast.notify()

    if (options?.tableId) {
      const tables = await localDb.getTables(ctx.tenantId, ctx.sucursalId)
      const table = tables.find(t => t.id === options.tableId)
      if (table) {
        const freed: RestaurantTable = { ...table, status: 'libre', current_order_id: undefined, opened_at: undefined }
        await localDb.updateTable(freed)
        await pushOrderRemote(order, items, payments, freed)
      } else {
        await pushOrderRemote(order, items, payments)
      }
    } else {
      await pushOrderRemote(order, items, payments)
    }

    return { order: { ...order, items }, payment, payments }
  },

  async sendToKitchen(ctx: TenantContext, lines: CartLine[], tableId?: string): Promise<Order> {
    const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0)
    const taxRate = ctx.taxRate ?? TAX_RATE
    const tax = subtotal * taxRate
    const total = subtotal + tax
    const orderId = crypto.randomUUID()
    const now = new Date().toISOString()

    const order: Order = {
      id: orderId,
      tenant_id: ctx.tenantId,
      sucursal_id: ctx.sucursalId,
      table_id: tableId,
      folio: generateFolio(),
      status: 'en_preparacion',
      waiter_id: ctx.userId,
      subtotal,
      tax,
      discount: 0,
      total,
      guests: 1,
      created_at: now,
      updated_at: now,
    }

    const items: OrderItem[] = lines.map((l) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: l.product_id,
      product_name: l.product_name,
      quantity: l.quantity,
      unit_price: l.unit_price,
      subtotal: l.unit_price * l.quantity,
      notes: l.notes,
      status: 'pendiente' as const,
    }))

    await localDb.saveOrder({ ...order, items }, items)
    await inventoryRepository.deductForOrder(ctx, lines, order.folio)
    opsBroadcast.notify()

    let tablePatch: RestaurantTable | undefined
    if (tableId) {
      const tables = await localDb.getTables(ctx.tenantId, ctx.sucursalId)
      const table = tables.find((t) => t.id === tableId)
      if (table) {
        tablePatch = {
          ...table,
          status: 'ocupada',
          current_order_id: orderId,
          opened_at: table.opened_at || now,
        }
        await localDb.updateTable(tablePatch)
        opsBroadcast.notify()
      }
    }

    await pushOrderRemote(order, items, undefined, tablePatch)

    return { ...order, items }
  },

  async updateItemStatus(itemId: string, status: OrderItem['status']): Promise<void> {
    const item = await localDb.findOrderItem(itemId)
    if (!item) return
    const updated = { ...item, status }
    await localDb.updateOrderItem(updated)
    opsBroadcast.notify()
    try {
      await orderService.updateItemStatus(itemId, status)
    } catch { /* sync */ }
  },

  async splitBill(ctx: TenantContext, orderId: string, parts: number): Promise<{ perPerson: number; total: number }> {
    const orders = await localDb.getOrders(ctx.tenantId, ctx.sucursalId)
    const order = orders.find(o => o.id === orderId)
    if (!order) throw new Error('Orden no encontrada')
    const perPerson = Math.ceil((order.total / parts) * 100) / 100
    return { perPerson, total: order.total }
  },

  async updateOrderStatus(orderId: string, status: Order['status'], ctx?: TenantContext): Promise<void> {
    if (!ctx) return
    const orders = await localDb.getOrders(ctx.tenantId, ctx.sucursalId)
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const updated = { ...order, status, updated_at: new Date().toISOString() }
    await localDb.updateOrder(updated)
    opsBroadcast.notify()
    try {
      await orderService.updateOrderStatus(orderId, status)
    } catch { /* sync */ }
  },
}
