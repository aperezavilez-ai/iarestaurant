/**
 * Crea usuarios staff demo en Supabase Auth (confirmados).
 * Uso: node scripts/seed-staff.mjs
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

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const STAFF = [
  { email: 'alfonsoavilery@icloud.com', password: 'Calurore1028@', full_name: 'Alfonso Avilery', role: 'admin_restaurant' },
  { email: 'cajero@iarestaurant.com', password: 'demo123', full_name: 'Cajero Demo', role: 'cajero' },
  { email: 'mesero@iarestaurant.com', password: 'demo123', full_name: 'Mesero Demo', role: 'mesero' },
  { email: 'cocina@iarestaurant.com', password: 'demo123', full_name: 'Cocina Demo', role: 'cocina' },
]

for (const u of STAFF) {
  const { data: list } = await admin.auth.admin.listUsers()
  const exists = list?.users?.find((x) => x.email === u.email)
  if (exists) {
    await admin.auth.admin.updateUserById(exists.id, { email_confirm: true })
    console.log('OK (ya existe):', u.email)
    continue
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { full_name: u.full_name, role: u.role },
  })
  if (error) {
    console.error('Error', u.email, error.message)
  } else {
    console.log('Creado:', u.email, data.user.id)
  }
}

console.log('Staff listo.')
