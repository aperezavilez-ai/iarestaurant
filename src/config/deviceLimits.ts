import type { Tenant } from '@/types'

export const PLAN_DEVICE_LIMITS: Record<Tenant['plan'], number> = {
  basico: 3,
  profesional: 8,
  enterprise: 25,
}

export function getTenantDeviceLimit(tenant: Tenant): number {
  if (tenant.max_devices != null && tenant.max_devices > 0) {
    return tenant.max_devices
  }
  return PLAN_DEVICE_LIMITS[tenant.plan] ?? 3
}
