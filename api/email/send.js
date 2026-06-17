import {
  setCors,
  verifyNotifier,
  sendResendEmail,
  logNotification,
} from './_lib.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const gate = await verifyNotifier(req)
  if (gate.error) return res.status(gate.status).json({ error: gate.error })

  const { admin, profile, organization } = gate
  const { type, title, message, recipient, html } = req.body || {}

  if (!title || !message) {
    return res.status(400).json({ error: 'Título y mensaje requeridos' })
  }

  const emailConfig = organization.email_config || {}
  const alerts = emailConfig.alerts || {}

  if (type === 'order_ready' && alerts.order_ready === false) {
    return res.status(200).json({ status: 'skipped', reason: 'alert_disabled' })
  }
  if (type === 'payment_complete' && alerts.payment_complete === false) {
    return res.status(200).json({ status: 'skipped', reason: 'alert_disabled' })
  }
  if (type === 'daily_report' && alerts.daily_report === false) {
    return res.status(200).json({ status: 'skipped', reason: 'alert_disabled' })
  }

  const to =
    recipient ||
    organization.reports_email ||
    organization.email

  if (!to) {
    return res.status(400).json({ error: 'Configura el email de reportes en Ajustes' })
  }

  const safeHtml =
    html ||
    `<div style="font-family:sans-serif;max-width:520px">
      <h2 style="color:#f59000">${title}</h2>
      <p style="white-space:pre-line;color:#334155">${message}</p>
      <p style="font-size:12px;color:#94a3b8">IA·RESTAURANT · ${organization.name || ''}</p>
    </div>`

  try {
    const result = await sendResendEmail({
      to,
      subject: title,
      html: safeHtml,
      text: message,
    })
    const row = await logNotification(admin, profile.tenant_id, {
      channel: 'email',
      title,
      message,
      recipient: to,
      status: 'enviada',
      metadata: { type, resend_id: result.id },
    })
    return res.status(200).json({ status: 'enviada', notification_id: row?.id, resend_id: result.id })
  } catch (e) {
    await logNotification(admin, profile.tenant_id, {
      channel: 'email',
      title,
      message,
      recipient: to,
      status: 'fallida',
      metadata: { type, error: e instanceof Error ? e.message : 'error' },
    })
    return res.status(400).json({
      error: e instanceof Error ? e.message : 'No se pudo enviar el correo',
    })
  }
}
