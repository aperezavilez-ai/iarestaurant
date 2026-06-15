import { createClient } from '@supabase/supabase-js'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
}

async function verifyUser(req) {
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !serviceKey || !anonKey) {
    return { error: 'Servidor sin configurar SUPABASE_SERVICE_ROLE_KEY', status: 500 }
  }

  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return { error: 'No autorizado', status: 401 }
  }

  const token = authHeader.slice(7)
  const userClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: authData, error: authErr } = await userClient.auth.getUser(token)
  if (authErr || !authData.user) return { error: 'Sesión inválida', status: 401 }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: profile } = await admin
    .from('users')
    .select('id, tenant_id')
    .eq('id', authData.user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Usuario sin restaurante', status: 403 }

  const { data: organization } = await admin
    .from('organizations')
    .select('payment_config')
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle()

  return { admin, profile, paymentConfig: organization?.payment_config || {} }
}

async function createMercadoPagoLink(config, amount, folio, returnUrl) {
  const accessToken = config.access_token
  if (!accessToken) throw new Error('Falta Access Token de Mercado Pago en Pasarelas')

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{
        title: `Orden ${folio}`,
        quantity: 1,
        unit_price: Number(amount),
        currency_id: 'MXN',
      }],
      back_urls: {
        success: returnUrl,
        failure: returnUrl,
        pending: returnUrl,
      },
      auto_return: 'approved',
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Mercado Pago rechazó la solicitud')
  return data.init_point || data.sandbox_init_point
}

async function createStripeLink(config, amount, folio, returnUrl) {
  const secretKey = config.secret_key
  if (!secretKey) throw new Error('Falta Secret Key de Stripe en Pasarelas')

  const body = new URLSearchParams({
    'line_items[0][price_data][currency]': 'mxn',
    'line_items[0][price_data][product_data][name]': `Orden ${folio}`,
    'line_items[0][price_data][unit_amount]': String(Math.round(Number(amount) * 100)),
    'line_items[0][quantity]': '1',
    'after_completion[type]': 'redirect',
    'after_completion[redirect][url]': returnUrl,
  })

  const res = await fetch('https://api.stripe.com/v1/payment_links', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Stripe rechazó la solicitud')
  return data.url
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const gate = await verifyUser(req)
  if (gate.error) return res.status(gate.status).json({ error: gate.error })

  const { amount, folio } = req.body || {}
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Monto inválido' })
  }
  if (!folio) return res.status(400).json({ error: 'Folio requerido' })

  const config = gate.paymentConfig
  const gateway = config.gateway
  if (!gateway) {
    return res.status(400).json({ error: 'Configura tu pasarela en Pasarelas de pago' })
  }

  const appUrl = process.env.VITE_APP_URL || 'https://www.iarestaurant.mx'
  const returnUrl = `${appUrl}/app/pos`

  try {
    let url
    if (gateway === 'mercadopago') {
      url = await createMercadoPagoLink(config, amount, folio, returnUrl)
    } else if (gateway === 'stripe') {
      url = await createStripeLink(config, amount, folio, returnUrl)
    } else {
      return res.status(400).json({ error: 'Clip aún no soporta links automáticos — usa terminal o link manual' })
    }
    return res.status(200).json({ url })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Error al crear link' })
  }
}
