import type { Order, RestaurantTable } from '@/types'

function tableSnapshot(t: RestaurantTable) {
  return `${t.id}|${t.status}|${t.number}|${t.opened_at ?? ''}|${t.assigned_waiter_id ?? ''}|${t.capacity}`
}

export function sameTables(a: RestaurantTable[], b: RestaurantTable[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (tableSnapshot(a[i]) !== tableSnapshot(b[i])) return false
  }
  return true
}

function orderSnapshot(o: Order) {
  return `${o.id}|${o.table_id ?? ''}|${o.total}|${o.status}|${o.folio}`
}

export function sameOrders(a: Order[], b: Order[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (orderSnapshot(a[i]) !== orderSnapshot(b[i])) return false
  }
  return true
}
