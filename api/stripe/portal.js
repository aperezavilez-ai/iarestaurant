import { setCors, appBaseUrl, getStripe, verifyBillingUser } from './_lib.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const stripe = getStripe()
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe no configurado en el servidor (STRIPE_SECRET_KEY)' })
  }

  const gate = await verifyBillingUser(req)
  if (gate.error) return res.status(gate.status).json({ error: gate.error })

  const { admin, tenant, userEmail } = gate

  try {
    let customerId = tenant.stripe_customer_id || null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail || undefined,
        name: tenant.name,
        metadata: { tenant_id: tenant.id },
      })
      customerId = customer.id
      await admin
        .from('tenants')
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq('id', tenant.id)
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appBaseUrl()}/app/subscriptions`,
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'No se pudo abrir el portal de facturación'
    return res.status(500).json({ error: message })
  }
}
