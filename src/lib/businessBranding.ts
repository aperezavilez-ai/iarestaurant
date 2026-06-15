import type { Organization, Sucursal, Tenant } from '@/types'

export interface BusinessBranding {
  tenantName: string
  sucursalName: string
  rfc?: string
  address?: string
  phone?: string
  email?: string
}

export function buildBusinessBranding(
  tenant?: Tenant | null,
  sucursal?: Sucursal | null,
  organization?: Organization | null,
): BusinessBranding {
  return {
    tenantName: tenant?.name || 'Mi Restaurante',
    sucursalName: sucursal?.name || 'Sucursal Principal',
    rfc: organization?.rfc,
    address: organization?.address || sucursal?.address,
    phone: organization?.phone || sucursal?.phone,
    email: organization?.email,
  }
}
