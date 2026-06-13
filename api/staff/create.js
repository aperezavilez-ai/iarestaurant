import { createClient } from '@supabase/supabase-js'

const ADMIN_ROLES = new Set(['admin_restaurant', 'admin_saas', 'gerente'])
const ASSIGNABLE_ROLES = new Set(['cajero', 'mesero', 'cocina', 'supervisor', 'capitan', 'gerente'])

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
    .select('id, role, tenant_id, sucursal_id')
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

  const { admin, profile } = gate
  const { email, password, full_name, role, sucursal_id, allowed_modules } = req.body || {}

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }
  if (!ASSIGNABLE_ROLES.has(role)) {
    return res.status(400).json({ error: 'Rol no permitido' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: String(email).trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role,
      sucursal_id: sucursal_id || profile.sucursal_id,
      allowed_modules: allowed_modules || [],
    },
  })
  if (createErr) return res.status(400).json({ error: createErr.message })

  const userId = created.user.id
  await admin.from('users').update({
    tenant_id: profile.tenant_id,
    email: String(email).trim().toLowerCase(),
    full_name,
    role,
    sucursal_id: sucursal_id || profile.sucursal_id,
    is_active: true,
    allowed_modules: allowed_modules || [],
  }).eq('id', userId)

  const { data: row } = await admin.from('users').select('*').eq('id', userId).single()
  return res.status(200).json({ user: row })
}
