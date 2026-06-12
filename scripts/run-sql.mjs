/**
 * Ejecuta SQL en Supabase remoto vía Management API.
 * Requiere SUPABASE_ACCESS_TOKEN en .env (Account → Access Tokens)
 *
 * Uso:
 *   node scripts/run-sql.mjs "SELECT 1"
 *   node scripts/run-sql.mjs supabase/migrations/004_auth_production.sql
 */
import { readFileSync, existsSync } from 'node:fs'
import { loadEnv, PROJECT_REF } from './load-env.mjs'

loadEnv()

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('Falta SUPABASE_ACCESS_TOKEN en .env')
  console.error('Crea uno en: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const arg = process.argv[2]
if (!arg) {
  console.error('Uso: node scripts/run-sql.mjs <archivo.sql | query>')
  process.exit(1)
}

const query = existsSync(arg) ? readFileSync(arg, 'utf8') : arg

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
})

const body = await res.text()
if (!res.ok) {
  console.error('Error', res.status, body)
  process.exit(1)
}

console.log(body)
