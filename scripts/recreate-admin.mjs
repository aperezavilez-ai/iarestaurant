/**
 * Desactiva admins viejos y crea cuenta admin nueva
 * Uso: node scripts/recreate-admin.mjs
 */
import { loadEnv } from './load-env.mjs'
import { createClient } from '@supabase/supabase-js'

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const RETIRE_EMAILS = ['alfonsoavilery@icloud.com', 'alfonsoaviler@icloud.com']
const NEW_ADMIN = {
  email: 'admin@iarestaurant.mx',
  password: 'AdminIAR2026!',
  full_name: 'Alfonso Admin',
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

const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 })
if (listErr) throw listErr

for (const email of RETIRE_EMAILS) {
  const old = list?.users?.find((u) => u.email?.toLowerCase() === email)
  if (!old) continue
  await admin.from('users').update({ is_active: false }).eq('id', old.id)
  await admin.auth.admin.updateUserById(old.id, {
    ban_duration: '876000h',
    password: crypto.randomUUID(),
  })
  console.log('Desactivado:', email)
}

let existingNew = list?.users?.find((u) => u.email?.toLowerCase() === NEW_ADMIN.email)
if (existingNew) {
  await admin.auth.admin.updateUserById(existingNew.id, {
    password: NEW_ADMIN.password,
    email_confirm: true,
    ban_duration: 'none',
  })
  console.log('Admin existente actualizado:', NEW_ADMIN.email)
} else {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: NEW_ADMIN.email,
    password: NEW_ADMIN.password,
    email_confirm: true,
    user_metadata: {
      full_name: NEW_ADMIN.full_name,
      role: NEW_ADMIN.role,
    },
  })
  if (createErr) throw createErr
  existingNew = created.user
  console.log('Admin creado:', NEW_ADMIN.email, existingNew.id)
}

const { error: profileErr } = await admin.from('users').upsert({
  id: existingNew.id,
  tenant_id: NEW_ADMIN.tenant_id,
  email: NEW_ADMIN.email,
  full_name: NEW_ADMIN.full_name,
  role: NEW_ADMIN.role,
  sucursal_id: NEW_ADMIN.sucursal_id,
  is_active: true,
  allowed_modules: [],
}, { onConflict: 'id' })
if (profileErr) throw profileErr

// Verificar login
const anon = createClient(url, process.env.VITE_SUPABASE_ANON_KEY)
const { error: signErr } = await anon.auth.signInWithPassword({
  email: NEW_ADMIN.email,
  password: NEW_ADMIN.password,
})
if (signErr) throw signErr
console.log('Login verificado OK')

console.log('\n=== Admin nuevo ===')
console.log('URL:      https://www.iarestaurant.mx/login')
console.log('Email:   ', NEW_ADMIN.email)
console.log('Password:', NEW_ADMIN.password)
