/**
 * Verifica variables Resend (no envía correo).
 * Uso: npm run qa:resend-config
 */
import { loadEnv } from './load-env.mjs'

loadEnv()

const required = ['RESEND_API_KEY', 'RESEND_FROM_EMAIL']
let missing = 0

console.log('QA Resend config\n')

for (const key of required) {
  const val = process.env[key]?.trim()
  if (val) {
    const preview = key.includes('KEY') ? `${val.slice(0, 8)}…` : val
    console.log(`  ✓ ${key} = ${preview}`)
  } else {
    missing++
    console.error(`  ✗ ${key} — no configurada`)
  }
}

const fromName = process.env.RESEND_FROM_NAME?.trim()
if (fromName) console.log(`  ✓ RESEND_FROM_NAME = ${fromName}`)

if (missing === 0) {
  console.log('\n✓ Resend listo para envío de correos')
  process.exit(0)
}

console.error('\n✗ Configura Resend en Vercel. Ver resend.com → API Keys y dominio verificado.')
process.exit(1)
