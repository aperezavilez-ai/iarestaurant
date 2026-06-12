import { authService } from '@/services/authService'
import { tenantService } from '@/services/tenantService'
import { isSupabaseConfigured } from '@/lib/config'
import { localDb } from '@/lib/localDb'
import { DEMO_CREDENTIALS, SEED_STAFF, SEED_TENANT, SEED_SUCURSAL } from '@/data/seed'
import type { User, Tenant, Sucursal } from '@/types'

export interface AuthSession {
  user: User
  tenant: Tenant
  sucursal: Sucursal
}

export const authRepository = {
  async signIn(email: string, password: string): Promise<AuthSession> {
    await localDb.ensureLocalSeed()

    if (isSupabaseConfigured()) {
      try {
        const { user: authUser } = await authService.signIn(email, password)
        const profile = await authService.getUserProfile(authUser.id)
        if (!profile) throw new Error('Perfil no encontrado')
        const tenant = await tenantService.getTenant(profile.tenant_id)
        const sucursal = profile.sucursal_id
          ? await tenantService.getSucursal(profile.sucursal_id)
          : (await tenantService.getSucursales(profile.tenant_id))[0]
        if (!tenant || !sucursal) throw new Error('Tenant o sucursal no encontrados')
        return { user: profile, tenant, sucursal }
      } catch (err) {
        if (!import.meta.env.DEV) throw err
      }
    }

    const cred = DEMO_CREDENTIALS.find((c) => c.email === email && c.password === password)
    if (!cred) throw new Error('Credenciales incorrectas')

    const user = SEED_STAFF[cred.userIndex]
    return { user, tenant: SEED_TENANT, sucursal: SEED_SUCURSAL }
  },

  async restoreSession(): Promise<AuthSession | null> {
    await localDb.ensureLocalSeed()

    if (isSupabaseConfigured()) {
      try {
        const session = await authService.getSession()
        if (!session?.user) return null
        const profile = await authService.getUserProfile(session.user.id)
        if (!profile) return null
        const tenant = await tenantService.getTenant(profile.tenant_id)
        const sucursal = profile.sucursal_id
          ? await tenantService.getSucursal(profile.sucursal_id)
          : (await tenantService.getSucursales(profile.tenant_id))[0]
        if (!tenant || !sucursal) return null
        return { user: profile, tenant, sucursal }
      } catch {
        return null
      }
    }
    return null
  },

  async signUp(email: string, password: string, fullName: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Configura Supabase en .env para registrar cuentas reales')
    }
    await authService.signUp(email, password, fullName)
  },

  async requestPasswordReset(email: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Configura Supabase en .env para recuperar contraseña')
    }
    await authService.resetPassword(email)
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await authService.signOut()
      } catch {
        /* local session cleared by store */
      }
    }
  },

  getDemoCredentials() {
    return DEMO_CREDENTIALS.map((c) => ({
      email: c.email,
      password: c.password,
      role: SEED_STAFF[c.userIndex].role,
      name: SEED_STAFF[c.userIndex].full_name,
    }))
  },
}
