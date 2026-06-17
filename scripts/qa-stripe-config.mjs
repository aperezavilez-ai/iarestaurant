/**
 * Verifica variables Stripe SaaS (no llama a la API).
 * Uso: npm run qa:stripe-config
 * Falla si falta alguna — configurar en Vercel antes de activar cobro de planes.
 */
import { loadEnv } from './load-env.mjs'

loadEnv()

const required = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_BASICO',
  'STRIPE_PRICE_PROFESIONAL',
  'STRIPE_PRICE_ENTERPRISE',
]

let missing = 0
console.log('QA Stripe config — variables servidor\n')

for (const key of required) {
  const val = process.env[key]?.trim()
  if (val) {
    const preview = key.includes('SECRET') || key.includes('KEY')
      ? `${val.slice(0, 8)}…`
      : val
    console.log(`  ✓ ${key} = ${preview}`)
  } else {
    missing++
    console.error(`  ✗ ${key} — no configurada`)
  }
}

if (missing === 0) {
  console.log('\n✓ Stripe listo para checkout SaaS')
  process.exit(0)
}

console.error(`\n✗ Faltan ${missing} variable(s). Ver .env.example y Stripe Dashboard.`)
console.error('  Webhook: https://www.iarestaurant.mx/api/stripe/webhook')
process.exit(1)
