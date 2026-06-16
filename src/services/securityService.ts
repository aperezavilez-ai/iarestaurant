import { supabase } from '@/lib/supabase'
import type { Tenant } from '@/types'
import type { TenantDevice, LoginAuditEntry, TenantDeviceStatus } from '@/types/security'

export const securityService = {
  async getDeviceByFingerprint(tenantId: string, fingerprintHash: string): Promise<TenantDevice | null> {
    const { data } = await supabase
      .from('tenant_devices')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('fingerprint_hash', fingerprintHash)
      .neq('status', 'revoked')
      .maybeSingle()
    return data
  },

  async countDevices(tenantId: string, statuses?: TenantDeviceStatus[]): Promise<number> {
    let q = supabase
      .from('tenant_devices')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
    if (statuses?.length) q = q.in('status', statuses)
    const { count } = await q
    return count ?? 0
  },

  async insertDevice(device: Omit<TenantDevice, 'id' | 'created_at' | 'last_seen_at'>): Promise<TenantDevice> {
    const { data, error } = await supabase
      .from('tenant_devices')
      .insert({
        ...device,
        last_seen_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async touchDevice(id: string): Promise<void> {
    await supabase
      .from('tenant_devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', id)
  },

  async listTenantDevices(tenantId: string): Promise<TenantDevice[]> {
    const { data } = await supabase
      .from('tenant_devices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('last_seen_at', { ascending: false })
    return data || []
  },

  async updateDeviceStatus(
    id: string,
    status: TenantDeviceStatus,
    approvedBy?: string
  ): Promise<void> {
    const patch: Record<string, unknown> = { status }
    if (status === 'approved') {
      patch.approved_by = approvedBy
      patch.approved_at = new Date().toISOString()
      patch.revoked_at = null
    }
    if (status === 'revoked') {
      patch.revoked_at = new Date().toISOString()
    }
    const { error } = await supabase.from('tenant_devices').update(patch).eq('id', id)
    if (error) throw error
  },

  async logLogin(entry: Omit<LoginAuditEntry, 'id' | 'created_at'>): Promise<void> {
    await supabase.from('login_audit').insert(entry)
  },

  async listAllTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  async setTenantActive(tenantId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .update({ is_active: isActive })
      .eq('id', tenantId)
    if (error) throw error
  },
}
