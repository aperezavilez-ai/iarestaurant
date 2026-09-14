import { supabase } from '@/lib/supabase'
import { getAppUrl } from '@/lib/config'
import type { User } from '@/types'

const appUrl = () => getAppUrl()

async function fetchProfileViaApi(accessToken: string): Promise<User | null> {
  const res = await fetch('/api/auth/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return null
  const body = await res.json().catch(() => null)
  return (body?.profile as User) || null
}

export const authService = {
  async signUp(email: string, password: string, fullName: string, restaurantName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          restaurant_name: restaurantName?.trim() || '',
          role: 'admin_restaurant',
        },
        emailRedirectTo: `${appUrl()}/login`,
      },
    })
    if (error) throw error
    return data
  },
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },
  async getUserProfile(
    userId: string,
    email?: string | null,
    accessToken?: string | null,
  ): Promise<User | null> {
    const byId = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (byId.data) return byId.data as User

    const normalizedEmail = email?.trim().toLowerCase()
    if (normalizedEmail) {
      const byEmail = await supabase
        .from('users')
        .select('*')
        .ilike('email', normalizedEmail)
        .maybeSingle()
      if (byEmail.data) return byEmail.data as User
    }

    if (accessToken) {
      const viaApi = await fetchProfileViaApi(accessToken)
      if (viaApi) return viaApi
    }

    if (byId.error) {
      console.warn('[auth] profile by id:', byId.error.message)
    }
    return null
  },
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrl()}/forgot-password`,
    })
    if (error) throw error
  },
}
