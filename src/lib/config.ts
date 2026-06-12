export const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001'
export const DEMO_SUCURSAL_ID = '00000000-0000-0000-0000-000000000002'
export const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000003'

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return Boolean(
    url &&
    key &&
    !url.includes('tu-proyecto') &&
    !url.includes('your-project') &&
    key !== 'tu-anon-key-aqui' &&
    key !== 'your-anon-key'
  )
}

export function getDataMode(): 'local' | 'remote' {
  return isSupabaseConfigured() ? 'remote' : 'local'
}

/** URL pública de la app (Vercel o local). Usada en redirects de Auth. */
export function getAppUrl(): string {
  const fromEnv = import.meta.env.VITE_APP_URL
  if (fromEnv && !fromEnv.includes('localhost') && !fromEnv.includes('tu-app')) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:5173'
}
