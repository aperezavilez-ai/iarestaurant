import {
  setCors,
  appBaseUrl,
  getStripe,
  priceIdForPlan,
  verifyBillingUser,
} from './_lib.js'

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

  const { admin, profile, tenant, userEmail } = gate
  const planId = req.body?.planId
  if (!['basico', 'profesional', 'enterprise'].includes(planId)) {
    return res.status(400).json({ error: 'Plan inválido' })
  }

  const priceId = priceIdForPlan(planId)
  if (!priceId) {
    return res.status(503).json({
      error: `Precio Stripe no configurado para el plan ${planId}`,
    })
  }

  const base = appBaseUrl()
  const successUrl = `${base}/app/subscriptions?stripe=success`
  const cancelUrl = `${base}/app/subscriptions?stripe=cancel`

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

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: tenant.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { tenant_id: tenant.id, plan_id: planId },
      subscription_data: {
        metadata: { tenant_id: tenant.id, plan_id: planId },
      },
      allow_promotion_codes: true,
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'No se pudo crear la sesión de pago'
    return res.status(500).json({ error: message })
  }
}
