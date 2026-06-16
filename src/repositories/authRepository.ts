import { authService } from '@/services/authService'
import { tenantService } from '@/services/tenantService'
import { isSupabaseConfigured } from '@/lib/config'
import { localDb } from '@/lib/localDb'
import { DEMO_CREDENTIALS, SEED_STAFF, SEED_TENANT, SEED_SUCURSAL } from '@/data/seed'
import type { User, Tenant, Sucursal } from '@/types'

const ADMIN_EMAIL = 'admin@iarestaurant.mx'
const RETIRED_ADMIN_EMAILS = ['alfonsoavilery@icloud.com', 'alfonsoaviler@icloud.com']

function normalizeLoginError(email: string, err: unknown): Error {
  const normalized = email.trim().toLowerCase()
  if (normalized === 'alfonsoaviler@icloud.com') {
    return new Error(`Correo incorrecto. Usa: ${ADMIN_EMAIL}`)
  }
  if (RETIRED_ADMIN_EMAILS.includes(normalized)) {
    return new Error(`Cuenta desactivada. Usa: ${ADMIN_EMAIL} · contraseña AdminIAR2026!`)
  }
  if (err instanceof Error) {
    const msg = err.message
    if (msg.toLowerCase().includes('banned')) {
      return new Error(`Cuenta anterior desactivada. Usa: ${ADMIN_EMAIL} · contraseña AdminIAR2026!`)
    }
    if (msg.toLowerCase().includes('invalid login')) {
      if (normalized === ADMIN_EMAIL) {
        return new Error('Contraseña incorrecta. Admin demo: AdminIAR2026! (con 2026, no 2024)')
      }
      return new Error('Correo o contraseña incorrectos')
    }
    if (msg.includes('Email not confirmed')) {
      return new Error('Confirma tu correo para continuar')
    }
    return err
  }
  return new Error('Credenciales incorrectas')
}

async function persistBusinessContext(tenantId: string, sucursalId?: string) {
  const [tenant, organization, sucursales] = await Promise.all([
    tenantService.getTenant(tenantId),
    tenantService.getOrganization(tenantId),
    tenantService.getSucursales(tenantId),
  ])
  if (tenant) await localDb.saveTenant(tenant)
  if (organization) await localDb.saveOrganization(organization)
  for (const s of sucursales) await localDb.saveSucursal(s)
  if (sucursalId) {
    const sucursal = sucursales.find((s) => s.id === sucursalId) || (await tenantService.getSucursal(sucursalId))
    if (sucursal) await localDb.saveSucursal(sucursal)
  }
}

async function buildSession(profile: User): Promise<AuthSession | null> {
  const tenant = await tenantService.getTenant(profile.tenant_id)
  const sucursal = profile.sucursal_id
    ? await tenantService.getSucursal(profile.sucursal_id)
    : (await tenantService.getSucursales(profile.tenant_id))[0]
  if (!tenant || !sucursal) return null
  if (isSupabaseConfigured()) {
    await persistBusinessContext(profile.tenant_id, sucursal.id)
  }
  return { user: profile, tenant, sucursal }
}

export interface AuthSession {
  user: User
  tenant: Tenant
  sucursal: Sucursal
}

export const authRepository = {
  async signIn(email: string, password: string): Promise<AuthSession> {
    await localDb.ensureLocalSeed()
    const normalizedEmail = email.trim().toLowerCase()

    if (isSupabaseConfigured()) {
      try {
        const { user: authUser } = await authService.signIn(normalizedEmail, password)
        const profile = await authService.getUserProfile(authUser.id)
        if (!profile) throw new Error('Perfil no encontrado en el sistema')
        const session = await buildSession(profile)
        if (!session) throw new Error('Tenant o sucursal no encontrados')
        return session
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.toLowerCase().includes('failed to fetch')) {
          throw new Error('Sin conexión al servidor. Revisa tu red o intenta de nuevo.')
        }
        throw normalizeLoginError(normalizedEmail, err)
      }
    }

    const cred = DEMO_CREDENTIALS.find((c) => c.email === normalizedEmail && c.password === password)
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
        return buildSession(profile)
      } catch {
        return null
      }
    }
    return null
  },

  async signUp(email: string, password: string, fullName: string, restaurantName: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('El registro en línea no está disponible en este entorno')
    }
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        restaurant_name: restaurantName.trim(),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'No se pudo crear la cuenta')
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('La recuperación de contraseña no está disponible en este entorno')
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
