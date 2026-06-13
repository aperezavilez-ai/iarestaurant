import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Reservation, WaitlistEntry, Ingredient, PurchaseOrder, Supplier, StockMovement,
  Customer, DeliveryOrder, LoyaltyRule, Invoice, CashMovement, PartialCashCut,
} from '@/types/demo'
import {
  DEMO_RESERVATIONS, DEMO_INGREDIENTS, DEMO_PURCHASES, DEMO_SUPPLIERS,
  DEMO_CUSTOMERS, DEMO_DELIVERIES, DEMO_INVOICES,
} from '@/data/demoSeed'
import { DEMO_TENANT_ID } from '@/lib/config'

const DEFAULT_LOYALTY_RULES: LoyaltyRule[] = [
  { id: 'lr1', name: '1 punto por cada $10', points_per_amount: 1, amount_threshold: 10, active: true },
  { id: 'lr2', name: '100 puntos = $50 descuento', points_per_amount: 0, amount_threshold: 100, active: true },
  { id: 'lr3', name: 'Doble puntos martes', points_per_amount: 2, amount_threshold: 10, active: true },
]

function calcSegment(visits: number, total: number): Customer['segment'] {
  if (visits >= 15 || total >= 8000) return 'vip'
  if (visits >= 5 || total >= 2000) return 'frecuente'
  return 'nuevo'
}

interface OpsDataState {
  reservations: Reservation[]
  waitlist: WaitlistEntry[]
  ingredients: Ingredient[]
  purchases: PurchaseOrder[]
  suppliers: Supplier[]
  movements: StockMovement[]
  customers: Customer[]
  deliveries: DeliveryOrder[]
  loyaltyRules: LoyaltyRule[]
  invoices: Invoice[]
  cashMovements: CashMovement[]
  partialCuts: PartialCashCut[]
  resetIfEmpty: () => void
  hydrateInventory: (ingredients: Ingredient[], movements: StockMovement[]) => void
  addReservation: (r: Omit<Reservation, 'id' | 'tenant_id' | 'created_at' | 'status'> & { status?: Reservation['status'] }) => Reservation
  updateReservation: (id: string, patch: Partial<Reservation>) => void
  addWaitlist: (e: Omit<WaitlistEntry, 'id' | 'tenant_id' | 'created_at' | 'estimated_wait'> & { estimated_wait?: number }) => WaitlistEntry
  removeWaitlist: (id: string) => void
  adjustStock: (ingredientId: string, delta: number, reason: string) => void
  updatePurchaseStatus: (id: string, status: PurchaseOrder['status']) => void
  addCustomer: (c: Omit<Customer, 'id' | 'tenant_id' | 'visits' | 'points' | 'total_spent' | 'segment' | 'created_at'>) => Customer
  recordCustomerSale: (customerId: string, amount: number) => void
  redeemPoints: (customerId: string, points: number) => boolean
  addDelivery: (d: Omit<DeliveryOrder, 'id' | 'tenant_id' | 'created_at' | 'status'> & { status?: DeliveryOrder['status'] }) => DeliveryOrder
  updateDelivery: (id: string, patch: Partial<DeliveryOrder>) => void
  addInvoice: (inv: Omit<Invoice, 'id' | 'tenant_id' | 'folio' | 'created_at' | 'status'> & { status?: Invoice['status'] }) => Invoice
  updateInvoice: (id: string, patch: Partial<Invoice>) => void
  nextInvoiceFolio: () => string
  addCashMovement: (type: CashMovement['type'], amount: number, note: string) => CashMovement
  addPartialCut: (cut: Omit<PartialCashCut, 'id' | 'created_at'>) => PartialCashCut
}

const seedReservations: Reservation[] = DEMO_RESERVATIONS.map(r => ({
  ...r,
  created_at: new Date().toISOString(),
}))

export const useOpsDataStore = create<OpsDataState>()(
  persist(
    (set, get) => ({
      reservations: seedReservations,
      waitlist: [],
      ingredients: [...DEMO_INGREDIENTS],
      purchases: [...DEMO_PURCHASES],
      suppliers: [...DEMO_SUPPLIERS],
      movements: [],
      customers: [...DEMO_CUSTOMERS],
      deliveries: [...DEMO_DELIVERIES],
      loyaltyRules: DEFAULT_LOYALTY_RULES,
      invoices: [...DEMO_INVOICES],
      cashMovements: [],
      partialCuts: [],

      resetIfEmpty: () => {
        const s = get()
        if (!s.ingredients.length) set({ ingredients: [...DEMO_INGREDIENTS] })
        if (!s.reservations.length) set({ reservations: seedReservations })
        if (!s.customers.length) set({ customers: [...DEMO_CUSTOMERS] })
        if (!s.deliveries.length) set({ deliveries: [...DEMO_DELIVERIES] })
        if (!s.invoices.length) set({ invoices: [...DEMO_INVOICES] })
      },

      hydrateInventory: (ingredients, movements) => {
        set((s) => {
          const ingMap = new Map(s.ingredients.map((i) => [i.id, i]))
          for (const i of ingredients) ingMap.set(i.id, i)
          const movMap = new Map<string, StockMovement>()
          for (const m of movements) movMap.set(m.id, m)
          for (const m of s.movements) if (!movMap.has(m.id)) movMap.set(m.id, m)
          const mergedMovements = Array.from(movMap.values())
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .slice(0, 100)
          return {
            ingredients: ingredients.length ? Array.from(ingMap.values()) : s.ingredients,
            movements: movements.length ? mergedMovements : s.movements,
          }
        })
      },

      nextInvoiceFolio: () => {
        const year = new Date().getFullYear()
        const count = get().invoices.length + 1
        return `FAC-${year}-${String(count).padStart(6, '0')}`
      },

      addReservation: (data) => {
        const entry: Reservation = {
          ...data,
          id: crypto.randomUUID(),
          tenant_id: DEMO_TENANT_ID,
          status: data.status || 'pendiente',
          created_at: new Date().toISOString(),
        }
        set(s => ({ reservations: [entry, ...s.reservations] }))
        return entry
      },

      updateReservation: (id, patch) => {
        set(s => ({
          reservations: s.reservations.map(r => r.id === id ? { ...r, ...patch } : r),
        }))
      },

      addWaitlist: (data) => {
        const entry: WaitlistEntry = {
          ...data,
          id: crypto.randomUUID(),
          tenant_id: DEMO_TENANT_ID,
          estimated_wait: data.estimated_wait ?? 15,
          created_at: new Date().toISOString(),
        }
        set(s => ({ waitlist: [entry, ...s.waitlist] }))
        return entry
      },

      removeWaitlist: (id) => set(s => ({ waitlist: s.waitlist.filter(w => w.id !== id) })),

      adjustStock: (ingredientId, delta, reason) => {
        set(s => {
          const ing = s.ingredients.find(i => i.id === ingredientId)
          if (!ing) return s
          const movement: StockMovement = {
            id: crypto.randomUUID(),
            tenant_id: DEMO_TENANT_ID,
            ingredient_id: ingredientId,
            ingredient_name: ing.name,
            delta,
            reason,
            created_at: new Date().toISOString(),
          }
          return {
            ingredients: s.ingredients.map(i =>
              i.id === ingredientId ? { ...i, stock: Math.max(0, i.stock + delta) } : i
            ),
            movements: [movement, ...s.movements].slice(0, 100),
          }
        })
      },

      addCustomer: (data) => {
        const entry: Customer = {
          ...data,
          id: crypto.randomUUID(),
          tenant_id: DEMO_TENANT_ID,
          visits: 0,
          points: 0,
          total_spent: 0,
          segment: 'nuevo',
          created_at: new Date().toISOString().slice(0, 10),
        }
        set(s => ({ customers: [entry, ...s.customers] }))
        return entry
      },

      recordCustomerSale: (customerId, amount) => {
        set(s => ({
          customers: s.customers.map(c => {
            if (c.id !== customerId) return c
            const visits = c.visits + 1
            const total_spent = c.total_spent + amount
            const pointsEarned = Math.floor(amount / 10)
            return {
              ...c,
              visits,
              total_spent,
              points: c.points + pointsEarned,
              segment: calcSegment(visits, total_spent),
            }
          }),
        }))
      },

      redeemPoints: (customerId, points) => {
        const s = get()
        const c = s.customers.find(x => x.id === customerId)
        if (!c || c.points < points) return false
        set({
          customers: s.customers.map(x =>
            x.id === customerId ? { ...x, points: x.points - points } : x
          ),
        })
        return true
      },

      addDelivery: (data) => {
        const entry: DeliveryOrder = {
          ...data,
          id: crypto.randomUUID(),
          tenant_id: DEMO_TENANT_ID,
          status: data.status || 'recibido',
          created_at: new Date().toISOString(),
        }
        set(s => ({ deliveries: [entry, ...s.deliveries] }))
        return entry
      },

      updateDelivery: (id, patch) => {
        set(s => ({
          deliveries: s.deliveries.map(d => d.id === id ? { ...d, ...patch } : d),
        }))
      },

      addInvoice: (data) => {
        const entry: Invoice = {
          ...data,
          id: crypto.randomUUID(),
          tenant_id: DEMO_TENANT_ID,
          folio: get().nextInvoiceFolio(),
          status: data.status || 'pendiente',
          created_at: new Date().toISOString(),
        }
        set(s => ({ invoices: [entry, ...s.invoices] }))
        return entry
      },

      updateInvoice: (id, patch) => {
        set(s => ({
          invoices: s.invoices.map(i => i.id === id ? { ...i, ...patch } : i),
        }))
      },

      addCashMovement: (type, amount, note) => {
        const entry: CashMovement = {
          id: crypto.randomUUID(),
          tenant_id: DEMO_TENANT_ID,
          type,
          amount,
          note,
          created_at: new Date().toISOString(),
        }
        set(s => ({ cashMovements: [entry, ...s.cashMovements].slice(0, 30) }))
        return entry
      },

      addPartialCut: (cut) => {
        const entry: PartialCashCut = {
          ...cut,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        }
        set(s => ({ partialCuts: [entry, ...s.partialCuts].slice(0, 20) }))
        return entry
      },

      updatePurchaseStatus: (id, status) => {
        set(s => {
          const purchases = s.purchases.map(p => p.id === id ? { ...p, status } : p)
          let ingredients = s.ingredients
          if (status === 'recibida') {
            const po = s.purchases.find(p => p.id === id)
            if (po) {
              const bump = Math.ceil(po.total / 500)
              ingredients = s.ingredients.map((ing, idx) =>
                idx < 3 ? { ...ing, stock: ing.stock + bump } : ing
              )
            }
          }
          return { purchases, ingredients }
        })
      },
    }),
    {
      name: 'ia-restaurant-ops-data',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
