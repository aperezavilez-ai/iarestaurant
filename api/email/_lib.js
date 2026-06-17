import { createClient } from '@supabase/supabase-js'

const NOTIFIER_ROLES = new Set(['admin_restaurant', 'admin_saas', 'gerente'])

export function setCors(res, methods = 'POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
}

export async function verifyNotifier(req) {
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
    .select('id, tenant_id, role, email, full_name')
    .eq('id', authData.user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Usuario sin restaurante', status: 403 }
  if (!NOTIFIER_ROLES.has(profile.role)) {
    return { error: 'Sin permiso para enviar notificaciones', status: 403 }
  }

  const { data: organization } = await admin
    .from('organizations')
    .select('reports_email, email, email_config, whatsapp_alerts, whatsapp_config, name')
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle()

  return { admin, profile, organization: organization || {} }
}

export function resendFrom() {
  const from = process.env.RESEND_FROM_EMAIL?.trim()
  if (!from) return null
  const name = process.env.RESEND_FROM_NAME?.trim() || 'IA·RESTAURANT'
  return from.includes('<') ? from : `${name} <${from}>`
}

export async function sendResendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = resendFrom()
  if (!apiKey) throw new Error('RESEND_API_KEY no configurada en el servidor')
  if (!from) throw new Error('RESEND_FROM_EMAIL no configurada en el servidor')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || undefined,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.message || data?.error || 'Resend rechazó el envío'
    throw new Error(msg)
  }
  return data
}

export async function logNotification(admin, tenantId, entry) {
  const { data } = await admin.from('notifications').insert({
    tenant_id: tenantId,
    channel: entry.channel || 'email',
    title: entry.title,
    message: entry.message,
    recipient: entry.recipient,
    status: entry.status,
    metadata: entry.metadata || {},
  }).select().single()
  return data
}
