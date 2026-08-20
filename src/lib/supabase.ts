import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseUrl } from '@/lib/config'

const supabaseUrl = resolveSupabaseUrl()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, credentials: 'omit' }),
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
