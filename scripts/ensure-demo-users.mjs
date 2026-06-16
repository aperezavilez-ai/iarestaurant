/**
 * Restablece contraseñas de cuentas demo en Supabase Auth
 * Uso: node scripts/ensure-demo-users.mjs
 */
import { loadEnv } from './load-env.mjs'
import { createClient } from '@supabase/supabase-js'

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const anon = process.env.VITE_SUPABASE_ANON_KEY

const DEMO_USERS = [
  { email: 'admin@iarestaurant.mx', password: 'AdminIAR2026!', role: 'admin_restaurant' },
  { email: 'cajero@iarestaurant.com', password: 'demo123', role: 'cajero' },
  { email: 'mesero@iarestaurant.com', password: 'demo123', role: 'mesero' },
  { email: 'cocina@iarestaurant.com', password: 'demo123', role: 'cocina' },
]

if (!url || !key) {
  console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const client = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } })

const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })

for (const demo of DEMO_USERS) {
  let user = list?.users?.find((u) => u.email?.toLowerCase() === demo.email)
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: demo.email,
      password: demo.password,
      email_confirm: true,
      user_metadata: { full_name: demo.role, role: demo.role },
    })
    if (error) throw error
    user = data.user
    console.log('Creado:', demo.email)
  } else {
    await admin.auth.admin.updateUserById(user.id, {
      password: demo.password,
      email_confirm: true,
      ban_duration: 'none',
    })
    console.log('Actualizado:', demo.email)
  }

  const { error: signErr } = await client.auth.signInWithPassword({
    email: demo.email,
    password: demo.password,
  })
  console.log('  Login:', signErr ? signErr.message : 'OK')
  await client.auth.signOut()
}

console.log('\nListo. Admin: admin@iarestaurant.mx / AdminIAR2026!')
