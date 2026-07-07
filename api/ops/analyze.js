// ================================================================
// api/ops/analyze.js — Reporte diario de irregularidades operativas.
// Disparado 1x/día por Vercel Cron (ver vercel.json). Revisa, por cada
// tenant activo, las últimas 24h de: tiempos de cocina (recepción vs
// entrega de pedidos), diferencias de caja al cierre, e intentos de
// inicio de sesión sospechosos. Si encuentra algo, pide a Claude (vía
// GafCore API Proxy) un resumen breve y lo envía por WhatsApp al mismo
// canal que ya usan las demás alertas del sistema.
// ================================================================
import { createClient } from '@supabase/supabase-js'

const KITCHEN_THRESHOLD_MIN = {
  barra_caliente: 20,
  barra_fria: 12,
  bebidas: 8,
  postres: 10,
  default: 15,
}
const CASH_DIFF_TOLERANCE = 50 // MXN
const LOGIN_FAILURES_THRESHOLD = 5

function admin() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 10) return `52${digits}`
  if (digits.length === 12 && digits.startsWith('52')) return digits
  return digits
}

function buildWaLink(phone, message) {
  const to = normalizePhone(phone)
  if (!to) return ''
  return `https://wa.me/${to}?text=${encodeURIComponent(message)}`
}

async function sendCloudApi(config, to, body) {
  const phoneNumberId = config?.phone_number_id
  const accessToken = config?.access_token
  if (!phoneNumberId || !accessToken) return null

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizePhone(to),
      type: 'text',
      text: { body },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || 'WhatsApp API rechazó el envío')
  return data
}

/** Reconstruye la linea de tiempo de una orden a partir de audit_logs (trigger ya existente sobre `orders`). */
async function computeOrderTimings(db, tenantId, sinceIso) {
  const { data: logs } = await db
    .from('audit_logs')
    .select('record_id, new_values, created_at')
    .eq('tenant_id', tenantId)
    .eq('table_name', 'orders')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true })

  const timelines = new Map()
  for (const log of logs ?? []) {
    const status = log.new_values?.status
    if (!status) continue
    const list = timelines.get(log.record_id) ?? []
    list.push({ status, at: log.created_at })
    timelines.set(log.record_id, list)
  }

  const completed = []
  for (const [orderId, events] of timelines) {
    const created = events.find((e) => e.status === 'abierta') ?? events[0]
    const delivered = events.find((e) => e.status === 'entregada')
    if (!created || !delivered) continue
    const minutes = (new Date(delivered.at) - new Date(created.at)) / 60000
    completed.push({ orderId, minutes })
  }
  return completed
}

async function analyzeTenant(db, tenant, sinceIso) {
  const issues = []

  // 1) Tiempos de recepción -> entrega (a nivel orden completa; ver nota en propuesta
  // sobre granularidad por estación de cocina — requeriría timestamps por item).
  const timings = await computeOrderTimings(db, tenant.id, sinceIso)
  if (timings.length > 0) {
    const avg = timings.reduce((s, t) => s + t.minutes, 0) / timings.length
    const slow = timings.filter((t) => t.minutes > Math.max(avg * 1.6, KITCHEN_THRESHOLD_MIN.default))
    if (slow.length > 0) {
      issues.push(
        `${slow.length} de ${timings.length} pedidos tardaron mucho más de lo normal ` +
          `(promedio ${avg.toFixed(0)} min; los más lentos hasta ${Math.max(...slow.map((s) => s.minutes)).toFixed(0)} min).`,
      )
    }
  }

  // 2) Diferencias de caja al cierre.
  const { data: registers } = await db
    .from('cash_registers')
    .select('difference, closed_at')
    .eq('tenant_id', tenant.id)
    .eq('status', 'cerrada')
    .gte('closed_at', sinceIso)

  const badRegisters = (registers ?? []).filter((r) => Math.abs(Number(r.difference || 0)) > CASH_DIFF_TOLERANCE)
  if (badRegisters.length > 0) {
    issues.push(
      `${badRegisters.length} corte(s) de caja con diferencia mayor a $${CASH_DIFF_TOLERANCE} ` +
        `(la mayor: $${Math.max(...badRegisters.map((r) => Math.abs(r.difference))).toFixed(2)}).`,
    )
  }

  // 3) Intentos de inicio de sesión sospechosos.
  const { data: logins } = await db
    .from('login_audit')
    .select('success, email, ip_address')
    .eq('tenant_id', tenant.id)
    .gte('created_at', sinceIso)

  const failed = (logins ?? []).filter((l) => !l.success)
  if (failed.length >= LOGIN_FAILURES_THRESHOLD) {
    issues.push(`${failed.length} intentos de inicio de sesión fallidos en las últimas 24h.`)
  }

  const { data: pendingDevices } = await db
    .from('tenant_devices')
    .select('device_label')
    .eq('tenant_id', tenant.id)
    .eq('status', 'pending')

  if ((pendingDevices ?? []).length > 0) {
    issues.push(`${pendingDevices.length} dispositivo(s) nuevo(s) esperando aprobación.`)
  }

  return issues
}

async function summarizeWithClaude(projectKey, tenantName, issues) {
  const body = {
    model: 'claude-sonnet-5',
    max_tokens: 400,
    messages: [
      {
        role: 'system',
        content:
          'Eres un analista de operaciones para restaurantes. Recibes una lista de irregularidades ' +
          'detectadas en las últimas 24h y debes escribir un resumen breve (máx. 4 líneas), en español, ' +
          'priorizado por gravedad, listo para enviar por WhatsApp al dueño/gerente. Sin markdown.',
      },
      {
        role: 'user',
        content: `Restaurante: ${tenantName}\nIrregularidades detectadas:\n${issues.map((i) => `- ${i}`).join('\n')}`,
      },
    ],
  }

  const res = await fetch('https://gafcore-api-proxy.vercel.app/api/proxy/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-project-key': projectKey,
      'x-provider-id': '608200c4-280d-4c28-b058-7947cc4a0352', // claude
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.choices?.[0]?.message?.content?.trim() ?? null
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.authorization || ''
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'No autorizado' })
    }
  }

  const projectKey = process.env.GAFCORE_PROXY_PROJECT_KEY
  const db = admin()
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: tenants } = await db.from('tenants').select('id, name').eq('is_active', true)

  const results = []
  for (const tenant of tenants ?? []) {
    try {
      const issues = await analyzeTenant(db, tenant, sinceIso)
      if (issues.length === 0) {
        results.push({ tenant: tenant.name, status: 'sin_irregularidades' })
        continue
      }

      const { data: org } = await db
        .from('organizations')
        .select('whatsapp_alerts, whatsapp_config')
        .eq('tenant_id', tenant.id)
        .maybeSingle()

      const alerts = org?.whatsapp_config?.alerts || {}
      if (alerts.ops_daily_report === false) {
        results.push({ tenant: tenant.name, status: 'alerta_desactivada', issues: issues.length })
        continue
      }
      const teamPhone = org?.whatsapp_alerts
      if (!teamPhone) {
        results.push({ tenant: tenant.name, status: 'sin_whatsapp_configurado', issues: issues.length })
        continue
      }

      const summary =
        (projectKey && (await summarizeWithClaude(projectKey, tenant.name, issues).catch(() => null))) ||
        issues.join('\n')

      const title = 'Reporte diario de irregularidades'
      const fullMessage = `*${title}*\n${summary}`

      let status = 'pendiente'
      let metadata = {}
      try {
        const apiResult = await sendCloudApi(org.whatsapp_config, teamPhone, fullMessage)
        if (apiResult) {
          status = 'enviada'
          metadata = { type: 'ops_daily_report', mode: 'cloud_api', wamid: apiResult.messages?.[0]?.id }
        } else {
          metadata = { type: 'ops_daily_report', mode: 'wa_me', wa_url: buildWaLink(teamPhone, fullMessage) }
        }
      } catch (e) {
        status = 'fallida'
        metadata = { type: 'ops_daily_report', error: e instanceof Error ? e.message : 'error' }
      }

      await db.from('notifications').insert({
        tenant_id: tenant.id,
        channel: 'whatsapp',
        title,
        message: summary,
        recipient: teamPhone,
        status,
        metadata,
      })

      results.push({ tenant: tenant.name, status, issues: issues.length })
    } catch (e) {
      results.push({ tenant: tenant.name, status: 'error', error: e instanceof Error ? e.message : 'error' })
    }
  }

  return res.status(200).json({ ok: true, checked_at: new Date().toISOString(), results })
}
