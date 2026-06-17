import { buffer } from 'node:stream/consumers'
import {
  getStripe,
  planFromPriceId,
  applyPlanToTenant,
  subscriptionStatusFromStripe,
} from './_lib.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readRawBody(req) {
  if (typeof req.body === 'string') return req.body
  if (Buffer.isBuffer(req.body)) return req.body
  try {
    return await buffer(req)
  } catch {
    if (req.body && typeof req.body === 'object') {
      return Buffer.from(JSON.stringify(req.body))
    }
    return Buffer.from('')
  }
}

async function syncSubscription(admin, subscription) {
  const tenantId = subscription.metadata?.tenant_id
  if (!tenantId) return

  const priceId = subscription.items?.data?.[0]?.price?.id
  const planId =
    subscription.metadata?.plan_id ||
    planFromPriceId(priceId) ||
    null

  const status = subscriptionStatusFromStripe(subscription.status)
  const patch = {
    stripe_subscription_id: subscription.id,
    subscription_status: status,
    subscription_ends_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
  }

  if (['active', 'trialing'].includes(status) && planId) {
    await applyPlanToTenant(admin, tenantId, planId, patch)
    return
  }

  await admin
    .from('tenants')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', tenantId)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método no permitido')

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!stripe || !webhookSecret) {
    return res.status(503).send('Stripe webhook no configurado')
  }

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).send('Falta firma Stripe')

  let event
  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Firma inválida'
    return res.status(400).send(`Webhook Error: ${message}`)
  }

  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return res.status(500).send('Supabase no configurado')

  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const tenantId = session.metadata?.tenant_id || session.client_reference_id
        if (!tenantId) break

        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        const planId = session.metadata?.plan_id

        const patch = {
          stripe_customer_id: customerId || undefined,
          stripe_subscription_id: subscriptionId || undefined,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }

        if (planId) {
          await applyPlanToTenant(admin, tenantId, planId, patch)
        } else {
          await admin.from('tenants').update(patch).eq('id', tenantId)
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscription(admin, event.data.object)
        break
      }
      default:
        break
    }

    return res.status(200).json({ received: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error procesando webhook'
    return res.status(500).json({ error: message })
  }
}
