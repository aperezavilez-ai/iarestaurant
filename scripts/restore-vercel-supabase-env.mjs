import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadDotEnv(file) {
  const path = resolve(root, file)
  const out = {}
  if (!existsSync(path)) return out
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
  }
  return out
}

const env = loadDotEnv('.env')
const url = env.VITE_SUPABASE_URL
const anon = env.VITE_SUPABASE_ANON_KEY
const service = env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = env.VITE_APP_URL || 'https://www.iarestaurant.mx'

if (!url?.includes('/iarestaurant') || !anon || !service) {
  console.error('Faltan credenciales GafCore en .env')
  process.exit(1)
}

/** @type {{ name: string, value: string, sensitive: boolean }[]} */
const pairs = [
  { name: 'VITE_SUPABASE_URL', value: url, sensitive: false },
  { name: 'VITE_SUPABASE_ANON_KEY', value: anon, sensitive: false },
  { name: 'VITE_APP_URL', value: appUrl, sensitive: false },
  { name: 'NEXT_PUBLIC_SUPABASE_URL', value: url, sensitive: false },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: anon, sensitive: false },
  { name: 'SUPABASE_URL', value: url, sensitive: false },
  { name: 'SUPABASE_ANON_KEY', value: anon, sensitive: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: service, sensitive: true },
]

for (const { name, value, sensitive } of pairs) {
  const args = [
    '--yes',
    'vercel',
    'env',
    'add',
    name,
    'production,preview,development',
    '--value',
    value,
    sensitive ? '--sensitive' : '--no-sensitive',
    '--yes',
    '--force',
  ]
  const r = spawnSync('npx', args, { cwd: root, shell: true, encoding: 'utf8' })
  if (r.status !== 0) {
    console.error('FAIL', name)
    console.error(r.stdout)
    console.error(r.stderr)
    process.exit(1)
  }
  console.log('OK', name, sensitive ? '(secret)' : '(config)')
}

console.log('\nListo.')
