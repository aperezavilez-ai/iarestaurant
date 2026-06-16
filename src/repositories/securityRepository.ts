import { getDeviceFingerprint } from '@/lib/deviceFingerprint'
import { getTenantDeviceLimit } from '@/config/deviceLimits'
import { securityService } from '@/services/securityService'
import { SecurityAccessError } from '@/types/security'
import type { TenantDevice } from '@/types/security'
import type { AuthSession } from '@/repositories/authRepository'

export const securityRepository = {
  async enforceDeviceAccess(session: AuthSession): Promise<TenantDevice | null> {
    const { user, tenant, sucursal } = session

    if (!tenant.is_active) {
      await securityService.logLogin({
        tenant_id: tenant.id,
        user_id: user.id,
        email: user.email,
        user_agent: navigator.userAgent,
        success: false,
        reason: 'tenant_suspended',
      })
      throw new SecurityAccessError(
        'La licencia de este restaurante está suspendida. Contacta a soporte IA·RESTAURANT.',
        'tenant_suspended'
      )
    }

    if (user.role === 'admin_saas') {
      await securityService.logLogin({
        tenant_id: tenant.id,
        user_id: user.id,
        email: user.email,
        user_agent: navigator.userAgent,
        success: true,
        reason: 'saas_admin',
      })
      return null
    }

    const fp = await getDeviceFingerprint()
    const existing = await securityService.getDeviceByFingerprint(tenant.id, fp.hash)

    if (existing) {
      if (existing.status === 'revoked') {
        throw new SecurityAccessError(
          'Este equipo fue revocado. Solicita autorización al administrador del restaurante.',
          'device_revoked',
          existing
        )
      }
      if (existing.status === 'pending') {
        throw new SecurityAccessError(
          'Equipo pendiente de autorización. El administrador debe aprobarlo en Configuración → Equipos.',
          'device_pending',
          existing
        )
      }
      await securityService.touchDevice(existing.id)
      await securityService.logLogin({
        tenant_id: tenant.id,
        user_id: user.id,
        device_id: existing.id,
        email: user.email,
        user_agent: navigator.userAgent,
        success: true,
      })
      return existing
    }

    const activeCount = await securityService.countDevices(tenant.id, ['approved', 'pending'])
    const limit = getTenantDeviceLimit(tenant)

    if (activeCount >= limit) {
      throw new SecurityAccessError(
        `Límite de equipos alcanzado (${limit}). Revoca un equipo o actualiza tu plan.`,
        'device_limit'
      )
    }

    const isFirst = activeCount === 0
    const status = isFirst ? 'approved' : 'pending'

    const device = await securityService.insertDevice({
      tenant_id: tenant.id,
      sucursal_id: sucursal.id,
      user_id: user.id,
      fingerprint_hash: fp.hash,
      device_label: fp.label,
      status,
      user_agent: navigator.userAgent,
      approved_by: isFirst ? user.id : undefined,
      approved_at: isFirst ? new Date().toISOString() : undefined,
    })

    if (status === 'pending') {
      await securityService.logLogin({
        tenant_id: tenant.id,
        user_id: user.id,
        device_id: device.id,
        email: user.email,
        user_agent: navigator.userAgent,
        success: false,
        reason: 'device_pending',
      })
      throw new SecurityAccessError(
        'Nuevo equipo registrado. Espera aprobación del administrador para operar.',
        'device_pending',
        device
      )
    }

    await securityService.logLogin({
      tenant_id: tenant.id,
      user_id: user.id,
      device_id: device.id,
      email: user.email,
      user_agent: navigator.userAgent,
      success: true,
      reason: 'first_device',
    })
    return device
  },

  async listDevices(tenantId: string) {
    return securityService.listTenantDevices(tenantId)
  },

  async approveDevice(deviceId: string, approverId: string) {
    await securityService.updateDeviceStatus(deviceId, 'approved', approverId)
  },

  async revokeDevice(deviceId: string) {
    await securityService.updateDeviceStatus(deviceId, 'revoked')
  },

  async listAllTenants() {
    return securityService.listAllTenants()
  },

  async setTenantActive(tenantId: string, isActive: boolean) {
    await securityService.setTenantActive(tenantId, isActive)
  },
}
