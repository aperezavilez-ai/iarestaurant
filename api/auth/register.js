import { createClient } from '@supabase/supabase-js'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return res.status(500).json({ error: 'Registro no disponible — servidor sin configurar' })
  }

  const { email, password, full_name, restaurant_name } = req.body || {}
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const restaurantName = String(restaurant_name || '').trim()
  const fullName = String(full_name || '').trim()

  if (!normalizedEmail || !password || !fullName || !restaurantName) {
    return res.status(400).json({ error: 'Completa restaurante, nombre, correo y contraseña' })
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: String(password),
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      restaurant_name: restaurantName,
      role: 'admin_restaurant',
    },
  })

  if (createErr) {
    const msg = createErr.message || 'No se pudo crear la cuenta'
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
      return res.status(400).json({ error: 'Este correo ya está registrado. Inicia sesión o recupera tu contraseña.' })
    }
    return res.status(400).json({ error: msg })
  }

  const userId = created.user?.id
  if (!userId) {
    return res.status(500).json({ error: 'Usuario creado sin identificador' })
  }

  const { data: profile } = await admin
    .from('users')
    .select('id, tenant_id, sucursal_id')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.tenant_id) {
    return res.status(500).json({
      error: 'Cuenta creada pero el restaurante no se configuró. Contacta soporte.',
    })
  }

  return res.status(200).json({
    ok: true,
    user_id: userId,
    tenant_id: profile.tenant_id,
    message: 'Cuenta activa — ya puedes iniciar sesión',
  })
}
