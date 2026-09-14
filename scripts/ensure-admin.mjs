/**
 * Asegura cuenta admin propietaria en Supabase Auth + perfil public.users
 * Uso: node scripts/ensure-admin.mjs
 *
 * Credenciales por defecto (override con ADMIN_EMAIL / ADMIN_PASSWORD en .env):
 *   alfonsoavilery@icloud.com
 */
import { loadEnv } from './load-env.mjs'
import { createClient } from '@supabase/supabase-js'

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'alfonsoavilery@icloud.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'Calurore1028@'
const ADMIN = {
  email: adminEmail,
  password: adminPassword,
  full_name: 'Alfonso Avilery',
  role: 'admin_restaurant',
  tenant_id: '00000000-0000-0000-0000-000000000001',
  sucursal_id: '00000000-0000-0000-0000-000000000002',
}

if (!url || !key) {
  console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
let user = list?.users?.find((u) => u.email?.toLowerCase() === ADMIN.email)

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email: ADMIN.email,
    password: ADMIN.password,
    email_confirm: true,
    user_metadata: { full_name: ADMIN.full_name, role: ADMIN.role },
  })
  if (error) throw error
  user = data.user
  console.log('Admin creado en Auth:', user.id)
} else {
  await admin.auth.admin.updateUserById(user.id, {
    password: ADMIN.password,
    email_confirm: true,
    ban_duration: 'none',
    user_metadata: { full_name: ADMIN.full_name, role: ADMIN.role },
  })
  console.log('Admin restaurado (activo + password):', user.id)
}

const { error: profileErr } = await admin.from('users').upsert({
  id: user.id,
  tenant_id: ADMIN.tenant_id,
  email: ADMIN.email,
  full_name: ADMIN.full_name,
  role: ADMIN.role,
  sucursal_id: ADMIN.sucursal_id,
  is_active: true,
}, { onConflict: 'id' })

if (profileErr) throw profileErr
console.log('Perfil public.users OK')

const anon = createClient(url, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const { error: loginErr } = await anon.auth.signInWithPassword({
  email: ADMIN.email,
  password: ADMIN.password,
})
if (loginErr) {
  console.error('Login verificación FALLÓ:', loginErr.message)
  process.exit(1)
}
console.log('Login verificado OK')
console.log('\nAcceso admin:')
console.log('  Email:', ADMIN.email)
