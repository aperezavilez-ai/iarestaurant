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
}
