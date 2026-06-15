/**
 * Asegura cuenta admin en Supabase Auth + perfil public.users
 * Uso: node scripts/ensure-admin.mjs
 */
import { loadEnv } from './load-env.mjs'
import { createClient } from '@supabase/supabase-js'

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN = {
  email: 'alfonsoavilery@icloud.com',
  password: 'Calurore1028@',
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

const { data: list } = await admin.auth.admin.listUsers()
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
  })
  console.log('Admin actualizado (password + confirmado):', user.id)
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
console.log('\nAcceso admin:')
console.log('  Email:', ADMIN.email)
console.log('  Pass: ', ADMIN.password)
