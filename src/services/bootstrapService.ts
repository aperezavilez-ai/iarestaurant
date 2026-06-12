import { isSupabaseConfigured } from '@/lib/config'
import { localDb } from '@/lib/localDb'
import { supabase } from '@/lib/supabase'
import type { TenantContext } from '@/types/context'

/** Sincroniza datos de Supabase → IndexedDB al iniciar sesión remota */
export const bootstrapService = {
  async pullFromRemote(ctx: TenantContext): Promise<{ ok: boolean; tables: string[] }> {
    if (!isSupabaseConfigured()) return { ok: false, tables: [] }

    const synced: string[] = []

    try {
      const [products, tables, orders] = await Promise.all([
        supabase.from('products').select('*').eq('tenant_id', ctx.tenantId),
        supabase.from('tables').select('*').eq('sucursal_id', ctx.sucursalId),
        supabase.from('orders').select('*, order_items(*)').eq('sucursal_id', ctx.sucursalId).order('created_at', { ascending: false }).limit(100),
      ])

      if (products.data?.length) {
        for (const p of products.data) await localDb.saveProduct(p)
        synced.push('products')
      }

      if (tables.data?.length) {
        for (const t of tables.data) await localDb.updateTable(t)
        synced.push('tables')
      }

      if (orders.data?.length) {
        for (const o of orders.data) {
          const items = (o as { order_items?: unknown[] }).order_items || []
          const { order_items: _, ...order } = o as Record<string, unknown> & { order_items?: unknown[] }
          await localDb.saveOrder(order as never, items as never)
        }
        synced.push('orders')
      }

      return { ok: true, tables: synced }
    } catch {
      return { ok: false, tables: synced }
    }
  },
}
