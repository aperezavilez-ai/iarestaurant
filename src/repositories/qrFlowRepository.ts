import { supabase } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/config'
import { DEMO_SUCURSAL_ID, DEMO_TENANT_ID } from '@/lib/config'
import type { QROrder, WaiterAlert, ValidationMode } from '@/types/qrFlow'

function mapQROrder(row: Record<string, unknown>): QROrder {
  return {
    id: row.id as string,
    table_id: row.table_id as string,
    table_number: row.table_number as number,
    area: (row.area as string) || '',
    waiter_id: (row.waiter_id as string) || '',
    waiter_name: (row.waiter_name as string) || '',
    items: (row.items as QROrder['items']) || [],
    status: row.status as QROrder['status'],
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    folio: row.folio as string,
    kitchen_order_id: row.kitchen_order_id as string | undefined,
    created_at: row.created_at as string,
    validated_at: row.validated_at as string | undefined,
    rejected_reason: row.rejected_reason as string | undefined,
  }
}

function mapAlert(row: Record<string, unknown>): WaiterAlert {
  return {
    id: row.id as string,
    type: row.type as WaiterAlert['type'],
    table_number: row.table_number as number,
    order_id: row.order_id as string | undefined,
    message: row.message as string,
    read: Boolean(row.read),
    created_at: row.created_at as string,
  }
}

export const qrFlowRepository = {
  async fetchOrders(tenantId = DEMO_TENANT_ID): Promise<QROrder[]> {
    if (!isSupabaseConfigured()) return []
    const { data, error } = await supabase
      .from('qr_orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return []
    return (data || []).map(mapQROrder)
  },

  async fetchAlerts(tenantId = DEMO_TENANT_ID): Promise<WaiterAlert[]> {
    if (!isSupabaseConfigured()) return []
    const { data, error } = await supabase
      .from('waiter_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return []
    return (data || []).map(mapAlert)
  },

  async insertOrder(order: QROrder): Promise<QROrder | null> {
    if (!isSupabaseConfigured()) return order
    const { data, error } = await supabase.from('qr_orders').insert({
      id: order.id,
      tenant_id: DEMO_TENANT_ID,
      sucursal_id: DEMO_SUCURSAL_ID,
      table_id: order.table_id,
      table_number: order.table_number,
      area: order.area,
      waiter_id: order.waiter_id,
      waiter_name: order.waiter_name,
      items: order.items,
      status: order.status,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      folio: order.folio,
    }).select().single()
    if (error) return null
    return mapQROrder(data)
  },

  async updateOrder(id: string, patch: Partial<QROrder>): Promise<void> {
    if (!isSupabaseConfigured()) return
    await supabase.from('qr_orders').update(patch).eq('id', id)
  },

  async insertAlert(alert: WaiterAlert): Promise<void> {
    if (!isSupabaseConfigured()) return
    await supabase.from('waiter_alerts').insert({
      id: alert.id,
      tenant_id: DEMO_TENANT_ID,
      sucursal_id: DEMO_SUCURSAL_ID,
      type: alert.type,
      table_number: alert.table_number,
      order_id: alert.order_id,
      message: alert.message,
      read: alert.read,
    })
  },

  async markAlertRead(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return
    await supabase.from('waiter_alerts').update({ read: true }).eq('id', id)
  },

  async getValidationMode(tenantId = DEMO_TENANT_ID): Promise<ValidationMode> {
    if (!isSupabaseConfigured()) return 'validacion'
    const { data } = await supabase
      .from('tenant_settings')
      .select('qr_validation')
      .eq('tenant_id', tenantId)
      .single()
    return (data?.qr_validation as ValidationMode) || 'validacion'
  },

  async setValidationMode(mode: ValidationMode, tenantId = DEMO_TENANT_ID): Promise<void> {
    if (!isSupabaseConfigured()) return
    await supabase.from('tenant_settings').upsert({
      tenant_id: tenantId,
      qr_validation: mode,
      updated_at: new Date().toISOString(),
    })
  },
}
