/**
 * Lista usuarios del equipo en producción (sin contraseñas).
 * Uso: npm run staff:list
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env.mjs'

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

const { data: users, error } = await admin
  .from('users')
  .select('email, full_name, role, is_active')
  .order('role')

if (error) {
  console.error(error.message)
  process.exit(1)
}

console.log('\nEquipo IA·RESTAURANT — producción\n')
console.log('| Rol | Nombre | Email | Activo |')
console.log('|-----|--------|-------|--------|')
for (const u of users || []) {
  console.log(`| ${u.role} | ${u.full_name || '—'} | ${u.email} | ${u.is_active ? 'sí' : 'no'} |`)
}

console.log('\nContraseñas: entregar por canal privado (no por email grupal).')
console.log('Admin: npm run ensure:admin')
console.log('Staff demo: npm run supabase:staff\n')
