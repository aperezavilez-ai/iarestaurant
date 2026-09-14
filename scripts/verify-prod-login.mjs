import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env.mjs'

loadEnv()

const html = await fetch('https://www.iarestaurant.mx/login', { cache: 'no-store' }).then((r) => r.text())
const bundle = [...html.matchAll(/\/assets\/(index-[^"']+\.js)/g)].map((m) => m[1])[0]
const js = await fetch(`https://www.iarestaurant.mx/assets/${bundle}`, { cache: 'no-store' }).then((r) => r.text())

const hasPath = js.includes('supabase.gafcore.com/iarestaurant')
const hasOldAdmin = js.includes('AdminIAR2026')
const localAnon = process.env.VITE_SUPABASE_ANON_KEY
const hasLocalAnon = localAnon ? js.includes(localAnon.slice(0, 40)) : false

console.log('bundle', bundle)
console.log('has /iarestaurant URL', hasPath)
console.log('has AdminIAR2026', hasOldAdmin)
console.log('has current anon prefix', hasLocalAnon)

const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const { data, error } = await client.auth.signInWithPassword({
  email: 'alfonsoavilery@icloud.com',
  password: 'Calurore1028@',
})
if (error) {
  console.error('login FAIL', error.message)
  process.exit(1)
}
const { data: profile, error: pErr } = await client
  .from('users')
  .select('id,email,role,is_active')
  .eq('id', data.user.id)
  .maybeSingle()
console.log('login+profile', { ok: !!profile, email: profile?.email, err: pErr?.message })
await client.auth.signOut()

if (!hasPath || hasOldAdmin || !profile) process.exit(1)
console.log('PRODUCTION CHECKS OK')
