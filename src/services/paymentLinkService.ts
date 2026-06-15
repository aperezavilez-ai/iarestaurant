import { supabase } from '@/lib/supabase'

export async function createPaymentLink(amount: number, folio: string): Promise<string> {
  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token
  if (!token) throw new Error('Inicia sesión para generar el link de pago')

  const res = await fetch('/api/payments/create-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, folio }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'No se pudo generar el link de pago')
  if (!data.url) throw new Error('Respuesta inválida del servidor')
  return data.url as string
}
