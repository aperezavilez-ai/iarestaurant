/**
 * Configura dominio de producción en Supabase Auth (site_url + redirect URLs).
 *
 * Uso:
 *   node scripts/configure-domain.mjs
 *   node scripts/configure-domain.mjs https://iarestaurant.mx
 */
import { loadEnv } from './load-env.mjs'

loadEnv()

const DOMAIN = (process.argv[2] || 'https://www.iarestaurant.mx').replace(/\/$/, '')
const APEX_DOMAIN = DOMAIN.includes('://www.')
  ? DOMAIN.replace('://www.', '://')
  : DOMAIN.replace('://', '://www.')

const ALLOW_LIST = [
  `${DOMAIN}/**`,
  `${APEX_DOMAIN}/**`,
  'http://localhost:5173/**',
  'http://127.0.0.1:5173/**',
  'https://ia-restaurant.vercel.app/**',
  'https://*.vercel.app/**',
].join(',')

const PROJECT_REF = process.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!PROJECT_REF || !TOKEN) {
  console.error('Falta VITE_SUPABASE_URL o SUPABASE_ACCESS_TOKEN en .env')
  process.exit(1)
}

async function main() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  }

  const getRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, { headers })
  if (!getRes.ok) {
    console.error('No se pudo leer auth config:', await getRes.text())
    process.exit(1)
  }
  const before = await getRes.json()
  console.log('Auth antes:', { site_url: before.site_url, uri_allow_list: before.uri_allow_list })

  const patchRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      site_url: DOMAIN,
      uri_allow_list: ALLOW_LIST,
    }),
  })

  if (!patchRes.ok) {
    console.error('Error al actualizar auth:', await patchRes.text())
    process.exit(1)
  }

  const after = await patchRes.json()
  console.log('Auth actualizado:', { site_url: after.site_url, uri_allow_list: after.uri_allow_list })
  console.log('\nRecuerda en Vercel → Environment Variables:')
  console.log(`  VITE_APP_URL=${DOMAIN}`)
  console.log('\nLuego redeploy para que el build use el dominio nuevo.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
