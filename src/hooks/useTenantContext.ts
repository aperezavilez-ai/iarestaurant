import { useAuthStore } from '@/store/authStore'
import type { TenantContext } from '@/types/context'

export function useTenantContext(): TenantContext | null {
  const { user, tenant, sucursal } = useAuthStore()
  if (!user || !tenant || !sucursal) return null
  return {
    tenantId: tenant.id,
    sucursalId: sucursal.id,
    userId: user.id,
    taxRate: (sucursal.tax_rate || 16) / 100,
  }
}
