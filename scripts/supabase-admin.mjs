/**
 * Admin Supabase vía service_role (sin abrir el dashboard).
 * Requiere SUPABASE_SERVICE_ROLE_KEY en .env o .env.local
 *
 * Uso:
 *   node scripts/supabase-admin.mjs create-user email@x.com password "Nombre" admin_restaurant
 *   node scripts/supabase-admin.mjs confirm-user email@x.com
 *   node scripts/supabase-admin.mjs list-users
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env.mjs'

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env')
  console.error('Obtén service_role en: Supabase → Settings → API')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const [cmd, ...args] = process.argv.slice(2)

async function createUser(email, password, fullName = 'Usuario', role = 'admin_restaurant') {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })
  if (error) throw error
  console.log('Usuario creado:', data.user.id, email)
  const profile = await admin.from('users').select('id,email,role').eq('id', data.user.id).maybeSingle()
  console.log('Perfil public.users:', profile.data ?? 'pendiente trigger 004')
}

async function confirmUser(email) {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) throw listErr
  const user = list.users.find((u) => u.email === email)
  if (!user) throw new Error(`No existe: ${email}`)
  const { data, error } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true })
  if (error) throw error
  console.log('Email confirmado:', data.user.email)
}

async function listUsers() {
  const { data, error } = await admin.auth.admin.listUsers()
  if (error) throw error
  for (const u of data.users) {
    console.log(`${u.email} | ${u.id} | confirmed=${u.email_confirmed_at ? 'yes' : 'no'}`)
  }
}

try {
  if (cmd === 'create-user') {
    await createUser(args[0], args[1], args[2], args[3])
  } else if (cmd === 'confirm-user') {
    await confirmUser(args[0])
  } else if (cmd === 'list-users') {
    await listUsers()
  } else {
    console.log('Comandos: create-user | confirm-user | list-users')
    process.exit(1)
  }
} catch (err) {
  console.error(err.message ?? err)
  process.exit(1)
}
