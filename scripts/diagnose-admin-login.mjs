import { loadEnv } from './load-env.mjs'
import { createClient } from '@supabase/supabase-js'

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'alfonsoavilery@icloud.com'
const passwords = [process.env.ADMIN_PASSWORD || 'Calurore1028@']

const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
const client = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } })

const { data: users } = await admin.auth.admin.listUsers({ perPage: 200 })
const authUser = users?.users?.find((u) => u.email?.toLowerCase() === email)

console.log('=== Auth user ===')
if (!authUser) {
  console.log('NO EXISTE en auth.users')
} else {
  console.log('id:', authUser.id)
  console.log('email:', authUser.email)
  console.log('email_confirmed:', authUser.email_confirmed_at ? 'yes' : 'no')
  console.log('banned_until:', authUser.banned_until || 'none')
  console.log('last_sign_in:', authUser.last_sign_in_at)
}

const { data: profile } = await admin.from('users').select('*').eq('email', email).maybeSingle()
console.log('\n=== public.users ===')
console.log(profile ? JSON.stringify({ id: profile.id, email: profile.email, role: profile.role, is_active: profile.is_active }, null, 2) : 'NO PROFILE')

console.log('\n=== Login tests ===')
for (const pass of passwords) {
  const { data, error } = await client.auth.signInWithPassword({ email, password: pass })
  console.log(pass ? `${pass.slice(0, 3)}…` : '(empty)', error ? `FAIL: ${error.message}` : `OK user ${data.user?.id}`)
  if (data?.session) await client.auth.signOut()
}
