import { supabase } from '@/lib/supabase'
import type { Tenant, Sucursal, Organization } from '@/types'

export const tenantService = {
  async getTenant(id: string): Promise<Tenant | null> {
    const { data } = await supabase.from('tenants').select('*').eq('id', id).single()
    return data
  },

  async getSucursal(id: string): Promise<Sucursal | null> {
    const { data } = await supabase.from('sucursales').select('*').eq('id', id).single()
    return data
  },

  async getSucursales(tenantId: string): Promise<Sucursal[]> {
    const { data } = await supabase.from('sucursales').select('*').eq('tenant_id', tenantId).eq('is_active', true)
    return data || []
  },

  async getOrganization(tenantId: string): Promise<Organization | null> {
    const { data } = await supabase.from('organizations').select('*').eq('tenant_id', tenantId).maybeSingle()
    return data
  },

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<void> {
    await supabase.from('organizations').update(updates).eq('id', id)
  },

  async updateSucursal(id: string, updates: Partial<Sucursal>): Promise<void> {
    await supabase.from('sucursales').update(updates).eq('id', id)
  },

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<void> {
    await supabase.from('tenants').update(updates).eq('id', id)
  },
}
