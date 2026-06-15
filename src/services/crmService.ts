import { supabase } from '@/lib/supabase'
import type { Customer } from '@/types/demo'

function normalizeCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    name: row.name as string,
    email: (row.email as string) || undefined,
    phone: (row.phone as string) || undefined,
    visits: Number(row.visits) || 0,
    points: Number(row.points) || 0,
    total_spent: Number(row.total_spent) || 0,
    segment: (row.segment as Customer['segment']) || 'nuevo',
    created_at: (row.created_at as string)?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  }
}

export const crmService = {
  async getCustomers(tenantId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map((row) => normalizeCustomer(row as Record<string, unknown>))
  },

  async createCustomer(customer: Customer): Promise<Customer> {
    const { data, error } = await supabase.from('customers').insert({
      id: customer.id,
      tenant_id: customer.tenant_id,
      sucursal_id: customer.sucursal_id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      visits: customer.visits,
      points: customer.points,
      total_spent: customer.total_spent,
      segment: customer.segment,
      created_at: customer.created_at,
    }).select().single()
    if (error) throw error
    return normalizeCustomer(data as Record<string, unknown>)
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    const { error } = await supabase.from('customers').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) throw error
  },
}
