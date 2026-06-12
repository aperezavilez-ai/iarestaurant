import { SEED_TABLES, SEED_AREAS, SEED_STAFF } from '@/data/seed'

export function getTableByNumber(num: number) {
  const table = SEED_TABLES.find(t => t.number === num)
  if (!table) return null
  const area = SEED_AREAS.find(a => a.id === table.area_id)
  const waiter = SEED_STAFF.find(u => u.role === 'mesero')
  return {
    ...table,
    area_name: area?.name || 'Sin área',
    waiter_id: table.assigned_waiter_id || waiter?.id || 'user-mesero',
    waiter_name: waiter?.full_name || 'Mesero Demo',
  }
}
