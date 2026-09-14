import { supabase } from '@/lib/supabase'
import { getAppUrl } from '@/lib/config'
import type { User } from '@/types'

const appUrl = () => getAppUrl()

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
  async getUserProfile(userId: string, email?: string | null): Promise<User | null> {
    const byId = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (byId.data) return byId.data

    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail) return null

    const byEmail = await supabase
      .from('users')
      .select('*')
      .ilike('email', normalizedEmail)
      .maybeSingle()
    if (byEmail.error) return null
    return byEmail.data
  },
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrl()}/forgot-password`,
    })
    if (error) throw error
  },
}
