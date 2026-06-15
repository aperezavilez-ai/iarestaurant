import { supabase } from '@/lib/supabase'
import { DEMO_TENANT_ID, DEMO_SUCURSAL_ID, isSupabaseConfigured } from '@/lib/config'
import { withTimeout } from '@/lib/async'
import { SEED_CATEGORIES, SEED_PRODUCTS } from '@/data/seed'
import type { Category, Product } from '@/types'

const SEED_MENU = {
  products: SEED_PRODUCTS.filter((p) => p.is_active),
  categories: SEED_CATEGORIES.filter((c) => c.is_active),
}

export const publicMenuService = {
  async getMenu(tenantId = DEMO_TENANT_ID): Promise<{ products: Product[]; categories: Category[] }> {
    if (!isSupabaseConfigured()) return SEED_MENU

    try {
      const [productsRes, categoriesRes] = await withTimeout(
        Promise.all([
          Promise.resolve(
            supabase
              .from('products')
              .select('*, category:categories(*)')
              .eq('tenant_id', tenantId)
              .eq('is_active', true)
              .order('name')
          ),
          Promise.resolve(
            supabase
              .from('categories')
              .select('*')
              .eq('tenant_id', tenantId)
              .eq('is_active', true)
              .order('sort_order')
          ),
        ]),
        6000
      )
      if (productsRes.error) throw productsRes.error
      if (productsRes.data?.length) {
        return {
          products: productsRes.data as Product[],
          categories: (categoriesRes.data as Category[]) || SEED_MENU.categories,
        }
      }
    } catch {
      /* fallback seed */
    }
    return SEED_MENU
  },

  async getTenantName(tenantId = DEMO_TENANT_ID): Promise<string> {
    if (!isSupabaseConfigured()) return 'IA·RESTAURANT'
    try {
      const { data } = await withTimeout(
        Promise.resolve(
          supabase.from('tenants').select('name').eq('id', tenantId).maybeSingle()
        ),
        4000
      )
      if (data?.name) return data.name
    } catch {
      /* fallback */
    }
    return 'IA·RESTAURANT'
  },

  async resolveTableByNumber(num: number) {
    if (isSupabaseConfigured()) {
      try {
        const { data: table } = await withTimeout(
          Promise.resolve(
            supabase
              .from('tables')
              .select('id, number, area_id, tenant_id, sucursal_id, assigned_waiter_id, area:table_areas(name)')
              .eq('number', num)
              .maybeSingle()
          ),
          5000
        )

        if (table) {
          let waiterName = 'Mesero'
          if (table.assigned_waiter_id) {
            try {
              const { data: waiter } = await withTimeout(
                Promise.resolve(
                  supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', table.assigned_waiter_id)
                    .maybeSingle()
                ),
                3000
              )
              if (waiter?.full_name) waiterName = waiter.full_name
            } catch {
              /* ignore */
            }
          }
          const area = table.area as { name?: string } | null
          return {
            id: table.id as string,
            number: table.number as number,
            tenant_id: (table.tenant_id as string) || DEMO_TENANT_ID,
            sucursal_id: (table.sucursal_id as string) || DEMO_SUCURSAL_ID,
            area_id: table.area_id as string,
            area_name: area?.name || 'Sin área',
            waiter_id: (table.assigned_waiter_id as string) || '',
            waiter_name: waiterName,
          }
        }
      } catch {
        /* fallback seed */
      }
    }

    const { getTableByNumber } = await import('@/lib/tableLookup')
    const seedTable = getTableByNumber(num)
    if (!seedTable) return null
    return {
      ...seedTable,
      tenant_id: DEMO_TENANT_ID,
      sucursal_id: DEMO_SUCURSAL_ID,
    }
  },
}
