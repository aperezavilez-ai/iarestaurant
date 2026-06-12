import { supabase } from '@/lib/supabase'
import type { CashRegister } from '@/types'

export const cashService = {
  async getOpenRegister(tenantId: string, sucursalId: string): Promise<CashRegister | null> {
    const { data } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('sucursal_id', sucursalId)
      .eq('status', 'abierta')
      .maybeSingle()
    return data
  },

  async openRegister(register: CashRegister): Promise<CashRegister> {
    const { data, error } = await supabase.from('cash_registers').insert(register).select().single()
    if (error) throw error
    return data
  },

  async closeRegister(id: string, register: Partial<CashRegister>): Promise<void> {
    const { error } = await supabase.from('cash_registers').update(register).eq('id', id)
    if (error) throw error
  },
}
