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
    await supabase.from('tables').update({
      status,
      current_order_id: orderId || null,
      opened_at: status === 'ocupada' ? new Date().toISOString() : null,
    }).eq('id', tableId)
  },
}
