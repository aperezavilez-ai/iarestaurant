import { supabase } from '@/lib/supabase'
import type { TenantContext } from '@/types/context'

export type EmailAlertType =
  | 'order_ready'
  | 'payment_complete'
  | 'daily_report'
  | 'staff_welcome'
  | 'test'

export interface SendEmailResult {
  status: 'enviada' | 'skipped'
  notification_id?: string
  resend_id?: string
  reason?: string
}

export const emailService = {
  async sendAlert(
    _ctx: TenantContext,
    payload: {
      type: EmailAlertType
      title: string
      message: string
      recipient?: string
      html?: string
    },
  ): Promise<SendEmailResult> {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) throw new Error('Inicia sesión para enviar correos')

    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'No se pudo enviar el correo')

    return {
      status: data.status || 'enviada',
      notification_id: data.notification_id,
      resend_id: data.resend_id,
      reason: data.reason,
    }
  },
}
