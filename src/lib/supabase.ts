import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseUrl } from '@/lib/config'

const supabaseUrl = resolveSupabaseUrl()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

function fetchWithoutProxyBlockedHeaders(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  headers.delete('accept-profile')
  headers.delete('content-profile')
  headers.delete('x-retry-count')
  return fetch(input, { ...init, headers, credentials: 'omit' })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithoutProxyBlockedHeaders,
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 20 },
  },
})
