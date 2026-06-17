/**
 * Crea usuarios staff en Supabase Auth y sincroniza rol en public.users.
 * Uso: npm run supabase:staff
 */
import { loadEnv } from './load-env.mjs'
import { createClient } from '@supabase/supabase-js'

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const TENANT_ID = '00000000-0000-0000-0000-000000000001'
const SUCURSAL_ID = '00000000-0000-0000-0000-000000000002'

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const STAFF = [
  { email: 'alfonsoavilery@icloud.com', password: 'Calurore1028@', full_name: 'Alfonso Avilery', role: 'admin_restaurant' },
  { email: 'cajero@iarestaurant.com', password: 'demo123', full_name: 'Cajero Demo', role: 'cajero' },
  { email: 'mesero@iarestaurant.com', password: 'demo123', full_name: 'Mesero Demo', role: 'mesero' },
  { email: 'cocina@iarestaurant.com', password: 'demo123', full_name: 'Cocina Demo', role: 'cocina' },
]

const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })

for (const u of STAFF) {
  let user = list?.users?.find((x) => x.email?.toLowerCase() === u.email.toLowerCase())

  if (user) {
    await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    })
    console.log('Auth actualizado:', u.email)
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    })
    if (error) {
      console.error('Error', u.email, error.message)
      continue
    }
    user = data.user
    console.log('Creado:', u.email, user.id)
  }

  const { error: profileErr } = await admin.from('users').upsert({
    id: user.id,
    tenant_id: TENANT_ID,
    sucursal_id: SUCURSAL_ID,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    is_active: true,
  }, { onConflict: 'id' })

  if (profileErr) {
    console.error('Perfil', u.email, profileErr.message)
  } else {
    console.log('  Perfil:', u.role)
  }
}

console.log('\nStaff listo. Verificar: npm run staff:list')
