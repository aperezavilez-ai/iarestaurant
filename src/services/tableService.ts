import { supabase } from '@/lib/supabase'
import type { RestaurantTable, TableArea } from '@/types'

export const tableService = {
  async getTables(tenantId: string, sucursalId: string): Promise<RestaurantTable[]> {
    const { data } = await supabase
      .from('tables').select('*, area:table_areas(*)')
      .eq('tenant_id', tenantId).eq('sucursal_id', sucursalId).order('number')
    return data || []
  },
  async getAreas(tenantId: string, sucursalId: string): Promise<TableArea[]> {
    const { data } = await supabase
      .from('table_areas').select('*')
      .eq('tenant_id', tenantId).eq('sucursal_id', sucursalId).order('sort_order')
    return data || []
  },
  async updateTableStatus(tableId: string, status: RestaurantTable['status'], orderId?: string): Promise<void> {
    const patch: Record<string, unknown> = {
      status,
      current_order_id: orderId || null,
      opened_at: status === 'ocupada' ? new Date().toISOString() : null,
    }
    if (status === 'libre') {
      patch.customer_id = null
      patch.customer_name = null
    }
    await supabase.from('tables').update(patch).eq('id', tableId)
  },

  async patchTable(tableId: string, patch: Record<string, unknown>): Promise<void> {
    await supabase.from('tables').update(patch).eq('id', tableId)
  },
  async createArea(area: TableArea): Promise<void> {
    const { error } = await supabase.from('table_areas').insert({
      id: area.id,
      tenant_id: area.tenant_id,
      sucursal_id: area.sucursal_id,
      name: area.name,
      color: area.color,
      sort_order: area.sort_order,
      is_active: area.is_active,
    })
    if (error) throw error
  },
  async createTable(table: RestaurantTable): Promise<void> {
    const { error } = await supabase.from('tables').insert({
      id: table.id,
      tenant_id: table.tenant_id,
      sucursal_id: table.sucursal_id,
      area_id: table.area_id,
      number: table.number,
      capacity: table.capacity,
      status: table.status,
    })
    if (error) throw error
  },
}
