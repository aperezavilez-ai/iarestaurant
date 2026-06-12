import { supabase } from '@/lib/supabase'
import { getAppUrl } from '@/lib/config'
import type { User } from '@/types'

export const authService = {
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
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
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users').select('*').eq('id', userId).single()
    if (error) return null
    return data
  },
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrl()}/forgot-password`,
    })
    if (error) throw error
  },
}
