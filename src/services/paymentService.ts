import { supabase } from '@/lib/supabase'
import type { Payment } from '@/types'

export const paymentService = {
  async createPayment(payment: Payment): Promise<Payment> {
    const { data, error } = await supabase.from('payments').insert(payment).select().single()
    if (error) throw error
    return data
  },

  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    const { data } = await supabase.from('payments').select('*').eq('order_id', orderId)
    return data || []
  },

  async getPaymentsByTenant(tenantId: string, limit = 200): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },
}
