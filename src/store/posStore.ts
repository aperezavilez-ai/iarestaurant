import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Order } from '@/types'

export interface POSCartItem {
  lineId: string
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
  category: string
  variant_name?: string
  notes?: string
}

interface POSState {
  cart: POSCartItem[]
  tableId: string | null
  tableNumber: number | null
  guests: number
  discountPercent: number
  discountFixed: number
  promoCode: string | null
  existingOrderId: string | null
  existingOrderFolio: string | null
  customerId: string | null
  customerName: string | null
  setTable: (id: string | null, number: number | null) => void
  setGuests: (n: number) => void
  setDiscount: (percent: number, fixed: number, promo?: string | null) => void
  setCustomer: (id: string | null, name: string | null) => void
  addItem: (item: Omit<POSCartItem, 'lineId' | 'quantity'> & { quantity?: number }) => void
  updateQty: (lineId: string, delta: number) => void
  updateNotes: (lineId: string, notes: string) => void
  removeLine: (lineId: string) => void
  loadFromOrder: (order: Order, table?: { id: string; number: number }) => void
  clearCart: () => void
}

function lineKey(product_id: string, variant_name?: string, notes?: string) {
  return `${product_id}::${variant_name || ''}::${notes || ''}`
}

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      cart: [],
      tableId: null,
      tableNumber: null,
      guests: 1,
      discountPercent: 0,
      discountFixed: 0,
      promoCode: null,
      existingOrderId: null,
      existingOrderFolio: null,
      customerId: null,
      customerName: null,

      setTable: (id, number) => set({ tableId: id, tableNumber: number }),
      setGuests: (guests) => set({ guests: Math.max(1, guests) }),
      setDiscount: (discountPercent, discountFixed, promoCode = null) =>
        set({ discountPercent, discountFixed, promoCode }),
      setCustomer: (customerId, customerName) => set({ customerId, customerName }),

      addItem: (item) => {
        const key = lineKey(item.product_id, item.variant_name, item.notes)
        set(s => {
          const existing = s.cart.find(
            c => lineKey(c.product_id, c.variant_name, c.notes) === key
          )
          if (existing) {
            return {
              cart: s.cart.map(c =>
                c.lineId === existing.lineId
                  ? { ...c, quantity: c.quantity + (item.quantity ?? 1) }
                  : c
              ),
            }
          }
          const line: POSCartItem = {
            lineId: crypto.randomUUID(),
            product_id: item.product_id,
            product_name: item.variant_name
              ? `${item.product_name} (${item.variant_name})`
              : item.product_name,
            unit_price: item.unit_price,
            quantity: item.quantity ?? 1,
            category: item.category,
            variant_name: item.variant_name,
            notes: item.notes,
          }
          return { cart: [...s.cart, line] }
        })
      },

      updateQty: (lineId, delta) => {
        set(s => ({
          cart: s.cart
            .map(c => c.lineId === lineId ? { ...c, quantity: c.quantity + delta } : c)
            .filter(c => c.quantity > 0),
        }))
      },

      updateNotes: (lineId, notes) => set(s => ({
        cart: s.cart.map(c => c.lineId === lineId ? { ...c, notes } : c),
      })),

      removeLine: (lineId) => set(s => ({ cart: s.cart.filter(c => c.lineId !== lineId) })),

      loadFromOrder: (order, table) => {
        const cart: POSCartItem[] = (order.items || []).map(item => ({
          lineId: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          category: '',
          notes: item.notes,
        }))
        const subtotal = order.subtotal || cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)
        const discountFixed = Math.min(subtotal, order.discount || 0)
        set({
          cart,
          tableId: table?.id ?? order.table_id ?? null,
          tableNumber: table?.number ?? null,
          guests: order.guests ?? 1,
          discountPercent: 0,
          discountFixed,
          promoCode: null,
          existingOrderId: order.id,
          existingOrderFolio: order.folio,
        })
      },

      clearCart: () => set({
        cart: [],
        discountPercent: 0,
        discountFixed: 0,
        promoCode: null,
        existingOrderId: null,
        existingOrderFolio: null,
        customerId: null,
        customerName: null,
      }),
    }),
    {
      name: 'ia-restaurant-pos-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        cart: s.cart,
        tableId: s.tableId,
        tableNumber: s.tableNumber,
        guests: s.guests,
        discountPercent: s.discountPercent,
        discountFixed: s.discountFixed,
        promoCode: s.promoCode,
        existingOrderId: s.existingOrderId,
        existingOrderFolio: s.existingOrderFolio,
        customerId: s.customerId,
        customerName: s.customerName,
      }),
    }
  )
)

export function calcPOSTotals(
  cart: POSCartItem[],
  taxRate: number,
  discountPercent: number,
  discountFixed: number
) {
  const subtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const percentOff = subtotal * (discountPercent / 100)
  const discount = Math.min(subtotal, percentOff + discountFixed)
  const taxable = Math.max(0, subtotal - discount)
  const tax = taxable * taxRate
  const total = taxable + tax
  return { subtotal, discount, tax, total, taxable }
}
