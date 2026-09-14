import { createClient } from '@supabase/supabase-js'

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'
const DEFAULT_SUCURSAL_ID = '00000000-0000-0000-0000-000000000002'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
}

function getBearer(req) {
  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !serviceKey || !anonKey) {
    return res.status(500).json({ error: 'Servidor sin configurar Supabase' })
  }

  const token = getBearer(req)
  if (!token) return res.status(401).json({ error: 'No autorizado' })

  const userClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: authData, error: authErr } = await userClient.auth.getUser(token)
  if (authErr || !authData.user) {
    return res.status(401).json({ error: 'Sesión inválida' })
  }

  const authUser = authData.user
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let { data: profile, error: profileErr } = await admin
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (profileErr) {
    return res.status(500).json({ error: profileErr.message || 'Error al leer perfil' })
  }

  if (!profile) {
    const email = (authUser.email || '').trim().toLowerCase()
    if (email) {
      const byEmail = await admin
        .from('users')
        .select('*')
        .ilike('email', email)
        .maybeSingle()
      profile = byEmail.data
    }
  }

  if (!profile) {
    const email = (authUser.email || '').trim().toLowerCase()
    const fullName =
      authUser.user_metadata?.full_name ||
      (email ? email.split('@')[0] : 'Usuario')
    const role = authUser.user_metadata?.role || 'admin_restaurant'
    const { data: created, error: createErr } = await admin
      .from('users')
      .upsert(
        {
          id: authUser.id,
          tenant_id: DEFAULT_TENANT_ID,
          email,
          full_name: fullName,
          role,
          sucursal_id: DEFAULT_SUCURSAL_ID,
          is_active: true,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .maybeSingle()

    if (createErr) {
      return res.status(500).json({ error: createErr.message || 'No se pudo crear el perfil' })
    }
    profile = created
  }

  if (!profile) {
    return res.status(404).json({ error: 'Perfil no encontrado en el sistema' })
  }

  return res.status(200).json({ profile })
}
