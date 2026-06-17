import { supabase } from '@/lib/supabase'
import type { SaasPlan } from '@/data/saasPlans'

async function authHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Inicia sesión para gestionar tu suscripción')
  return `Bearer ${token}`
}

async function postStripe(path: string, body?: Record<string, unknown>): Promise<{ url: string }> {
  const res = await fetch(`/api/stripe/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: await authHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Error de facturación Stripe')
  if (!data.url) throw new Error('Stripe no devolvió URL de redirección')
  return { url: data.url as string }
}

export const subscriptionService = {
  async startCheckout(planId: SaasPlan['id']): Promise<string> {
    const { url } = await postStripe('checkout', { planId })
    return url
  },

  async openBillingPortal(): Promise<string> {
    const { url } = await postStripe('portal')
    return url
  },
}
