import { loadEnv } from './load-env.mjs'
import { createClient } from '@supabase/supabase-js'

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = 'admin@iarestaurant.mx'
const passwords = ['AdminIAR2026!', 'AdminIAR2024!', 'demo123']

const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
const client = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } })

const { data: users } = await admin.auth.admin.listUsers()
const authUser = users?.users?.find((u) => u.email?.toLowerCase() === email)

console.log('=== Auth user ===')
if (!authUser) {
  console.log('NO EXISTE en auth.users')
} else {
  console.log('id:', authUser.id)
  console.log('email:', authUser.email)
  console.log('email_confirmed:', authUser.email_confirmed_at ? 'yes' : 'no')
  console.log('last_sign_in:', authUser.last_sign_in_at)
}

const { data: profile } = await admin.from('users').select('*').eq('email', email).maybeSingle()
console.log('\n=== public.users ===')
console.log(profile ? JSON.stringify(profile, null, 2) : 'NO PROFILE')

if (profile?.tenant_id) {
  const { data: tenant } = await admin.from('tenants').select('id,name,is_active').eq('id', profile.tenant_id).single()
  console.log('\n=== tenant ===', tenant)
}
if (profile?.sucursal_id) {
  const { data: suc } = await admin.from('sucursales').select('id,name,is_active').eq('id', profile.sucursal_id).single()
  console.log('=== sucursal ===', suc)
}

console.log('\n=== Login tests (anon client) ===')
for (const pass of passwords) {
  const { data, error } = await client.auth.signInWithPassword({ email, password: pass })
  console.log(pass, error ? `FAIL: ${error.message}` : `OK user ${data.user?.id}`)
}

if (authUser) {
  const { data: profAnon, error: profErr } = await client
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()
  await client.auth.signInWithPassword({ email, password: 'AdminIAR2026!' })
  const session = (await client.auth.getSession()).data.session
  if (session) {
    const { data: profAuthed, error: e2 } = await client.from('users').select('*').eq('id', authUser.id).single()
    console.log('\n=== RLS profile read (authenticated) ===', e2 ? e2.message : 'OK', profAuthed?.email)
  }
}
