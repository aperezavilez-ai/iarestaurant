import { isSupabaseConfigured } from '@/lib/config'
import { withTimeout } from '@/lib/async'
import { tenantService } from '@/services/tenantService'
import { localDb } from '@/lib/localDb'
import { supabase } from '@/lib/supabase'
import { useOpsDataStore } from '@/store/opsDataStore'
import type { TenantContext } from '@/types/context'
import type { Ingredient, StockMovement } from '@/types/demo'

function mapMovement(row: Record<string, unknown>): StockMovement {
  const ing = row.ingredients as { name?: string } | null
  return {
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    ingredient_id: row.ingredient_id as string,
    ingredient_name: ing?.name ?? '',
    delta: Number(row.delta),
    reason: (row.reason as string) ?? '',
    created_at: row.created_at as string,
  }
}

/** Sincroniza datos de Supabase → IndexedDB al iniciar sesión remota */
export const bootstrapService = {
  async pullFromRemote(ctx: TenantContext): Promise<{ ok: boolean; tables: string[] }> {
    if (!isSupabaseConfigured()) return { ok: false, tables: [] }

    try {
      return await withTimeout(pullFromRemoteInner(ctx), 12_000)
    } catch {
      return { ok: false, tables: [] }
    }
  },
}

async function pullFromRemoteInner(ctx: TenantContext): Promise<{ ok: boolean; tables: string[] }> {
  const synced: string[] = []

    try {
      const [categories, products, areas, tables, orders, payments, ingredients, movements, tenant, organization, sucursales] = await Promise.all([
        supabase.from('categories').select('*').eq('tenant_id', ctx.tenantId),
        supabase.from('products').select('*').eq('tenant_id', ctx.tenantId),
        supabase.from('table_areas').select('*').eq('sucursal_id', ctx.sucursalId),
        supabase.from('tables').select('*').eq('sucursal_id', ctx.sucursalId),
        supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('sucursal_id', ctx.sucursalId)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('payments')
          .select('*')
          .eq('tenant_id', ctx.tenantId)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('ingredients').select('*').eq('tenant_id', ctx.tenantId),
        supabase
          .from('stock_movements')
          .select('*, ingredients(name)')
          .eq('tenant_id', ctx.tenantId)
          .order('created_at', { ascending: false })
          .limit(100),
        tenantService.getTenant(ctx.tenantId),
        tenantService.getOrganization(ctx.tenantId),
        tenantService.getSucursales(ctx.tenantId),
      ])

      if (tenant) {
        await localDb.saveTenant(tenant)
        synced.push('tenants')
      }

      if (organization) {
        await localDb.saveOrganization(organization)
        synced.push('organizations')
      }

      if (sucursales?.length) {
        for (const s of sucursales) await localDb.saveSucursal(s)
        synced.push('sucursales')
      }

      if (categories.data?.length) {
        for (const c of categories.data) await localDb.saveCategory(c)
        synced.push('categories')
      }

      if (products.data?.length) {
        for (const p of products.data) await localDb.saveProduct(p)
        synced.push('products')
      }

      if (areas.data?.length) {
        for (const a of areas.data) await localDb.saveArea(a)
        synced.push('table_areas')
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

      if (payments.data?.length) {
        for (const p of payments.data) await localDb.savePayment(p)
        synced.push('payments')
      }

      if (ingredients.data?.length) {
        const mapped: Ingredient[] = ingredients.data.map((row) => ({
          id: row.id,
          tenant_id: row.tenant_id,
          name: row.name,
          unit: row.unit,
          stock: Number(row.stock),
          min_stock: Number(row.min_stock),
          cost: Number(row.cost),
          supplier_id: row.supplier_id,
        }))
        const movMapped = (movements.data || []).map((r) =>
          mapMovement(r as Record<string, unknown>)
        )
        useOpsDataStore.getState().hydrateInventory(mapped, movMapped)
        synced.push('ingredients')
      }

      return { ok: true, tables: synced }
    } catch {
      return { ok: false, tables: synced }
    }
}
