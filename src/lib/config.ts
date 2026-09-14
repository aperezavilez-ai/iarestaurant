export const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001'
export const DEMO_SUCURSAL_ID = '00000000-0000-0000-0000-000000000002'
export const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000003'

/** Dominio de producción (Vercel: apex redirige a www) */
export const PRODUCTION_APP_URL = 'https://www.iarestaurant.mx'

/** Endpoint público del proyecto Supabase de producción. */
export const SUPABASE_PROJECT_URL = 'https://supabase.gafcore.com/iarestaurant'

/**
 * En el navegador usamos same-origin `/sb` (proxy Vercel/Vite) porque el
 * gateway GafCore responde `Access-Control-Allow-Origin: *, *` en REST y el
 * browser bloquea el perfil/login aunque Auth sí pase.
 */
export function resolveSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/sb`
  }

  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || ''
  if (url && !url.includes('tu-proyecto') && !url.includes('your-project')) {
    try {
      const parsed = new URL(url)
      if (parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return url.replace(/\/$/, '')
      }
    } catch {
      // Fall back to the production endpoint below.
    }
  }
  return SUPABASE_PROJECT_URL
}

export function isSupabaseConfigured(): boolean {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return Boolean(
    key &&
    key !== 'tu-anon-key-aqui' &&
    key !== 'your-anon-key'
  )
}

/** En producción el sistema requiere Supabase — no hay modo offline/demo. */
export function isProductionMode(): boolean {
  return import.meta.env.PROD || isSupabaseConfigured()
}

export function getDataMode(): 'local' | 'remote' {
  return isSupabaseConfigured() ? 'remote' : 'local'
}

/** URL pública de la app (Vercel o local). Usada en redirects de Auth y QR. */
export function getAppUrl(): string {
  const fromEnv = import.meta.env.VITE_APP_URL as string | undefined
  if (fromEnv && !fromEnv.includes('localhost') && !fromEnv.includes('tu-app') && !fromEnv.includes('tu-proyecto')) {
    return fromEnv.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const { origin, hostname } = window.location
    if (hostname === 'iarestaurant.mx' || hostname === 'www.iarestaurant.mx') {
      return PRODUCTION_APP_URL
    }
    if (hostname.endsWith('.vercel.app') || hostname === 'localhost' || hostname === '127.0.0.1') {
      return origin
    }
  }
  if (import.meta.env.PROD) return PRODUCTION_APP_URL
  return 'http://localhost:5173'
}
