import { createClient } from '@supabase/supabase-js'

const ADMIN_ROLES = new Set(['admin_restaurant', 'admin_saas', 'gerente'])

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
}

async function verifyAdmin(req) {
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
    .select('id, role, tenant_id')
    .eq('id', authData.user.id)
    .single()

  if (!profile || !ADMIN_ROLES.has(profile.role)) {
    return { error: 'Sin permiso para gestionar personal', status: 403 }
  }

  return { admin, profile, callerId: authData.user.id }
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const gate = await verifyAdmin(req)
  if (gate.error) return res.status(gate.status).json({ error: gate.error })

  const { admin, callerId, profile } = gate
  const { userId } = req.body || {}

  if (!userId) return res.status(400).json({ error: 'Falta userId' })
  if (userId === callerId) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' })

  const { data: target } = await admin.from('users').select('id, role, tenant_id').eq('id', userId).single()
  if (!target || target.tenant_id !== profile.tenant_id) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }
  if (target.role === 'admin_restaurant' || target.role === 'admin_saas') {
    return res.status(400).json({ error: 'No se puede eliminar un administrador principal' })
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(userId)
  if (delErr) return res.status(400).json({ error: delErr.message })

  return res.status(200).json({ ok: true })
}
