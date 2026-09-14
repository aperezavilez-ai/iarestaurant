/**
 * Restaura el admin propietario (alfonsoavilery@icloud.com).
 * Uso: node scripts/recreate-admin.mjs
 *
 * NO desactiva la cuenta iCloud. NO crea admin@iarestaurant.mx.
 */
import { loadEnv } from './load-env.mjs'
import { createClient } from '@supabase/supabase-js'

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY

const OWNER_ADMIN = {
  email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'alfonsoavilery@icloud.com',
  password: process.env.ADMIN_PASSWORD || 'Calurore1028@',
  full_name: 'Alfonso Avilery',
  role: 'admin_restaurant',
  tenant_id: '00000000-0000-0000-0000-000000000001',
  sucursal_id: '00000000-0000-0000-0000-000000000002',
}

if (!url || !key || !anonKey) {
  console.error('Falta VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 })
if (listErr) throw listErr

let user = list?.users?.find((u) => u.email?.toLowerCase() === OWNER_ADMIN.email)

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email: OWNER_ADMIN.email,
    password: OWNER_ADMIN.password,
    email_confirm: true,
    user_metadata: { full_name: OWNER_ADMIN.full_name, role: OWNER_ADMIN.role },
  })
  if (error) throw error
  user = data.user
  console.log('Admin creado:', OWNER_ADMIN.email, user.id)
} else {
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: OWNER_ADMIN.password,
    email_confirm: true,
    ban_duration: 'none',
    user_metadata: { full_name: OWNER_ADMIN.full_name, role: OWNER_ADMIN.role },
  })
  if (error) throw error
  console.log('Admin restaurado (sin ban + password):', OWNER_ADMIN.email, user.id)
}

const { error: profileErr } = await admin.from('users').upsert({
  id: user.id,
  tenant_id: OWNER_ADMIN.tenant_id,
  email: OWNER_ADMIN.email,
  full_name: OWNER_ADMIN.full_name,
  role: OWNER_ADMIN.role,
  sucursal_id: OWNER_ADMIN.sucursal_id,
  is_active: true,
  allowed_modules: [],
}, { onConflict: 'id' })
if (profileErr) throw profileErr
console.log('Perfil public.users activo')

const anon = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
const { error: signErr } = await anon.auth.signInWithPassword({
  email: OWNER_ADMIN.email,
  password: OWNER_ADMIN.password,
})
if (signErr) throw signErr
console.log('Login verificado OK')

console.log('\n=== Admin propietario ===')
console.log('URL:    https://www.iarestaurant.mx/login')
console.log('Email: ', OWNER_ADMIN.email)
