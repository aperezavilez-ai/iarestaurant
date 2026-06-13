import { supabase } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/config'
import type { User, UserRole } from '@/types'

async function authHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sesión expirada — vuelve a iniciar sesión')
  return `Bearer ${token}`
}

export const userService = {
  async listByTenant(tenantId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('full_name')
    if (error) throw error
    return data || []
  },

  async createStaff(payload: {
    email: string
    password: string
    full_name: string
    role: UserRole
    sucursal_id?: string
    allowed_modules: string[]
  }): Promise<User> {
    if (!isSupabaseConfigured()) throw new Error('Requiere conexión en línea al sistema')

    const res = await fetch('/api/staff/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: await authHeader(),
      },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || 'No se pudo crear el usuario')
    return body.user as User
  },

  async deleteStaff(userId: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Requiere conexión en línea al sistema')

    const res = await fetch('/api/staff/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: await authHeader(),
      },
      body: JSON.stringify({ userId }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || 'No se pudo eliminar el usuario')
  },
}
