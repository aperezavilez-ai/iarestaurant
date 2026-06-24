import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { TenantContext } from '@/types/context'

export function useTenantContext(): TenantContext | null {
  const userId = useAuthStore((s) => s.user?.id)
  const tenantId = useAuthStore((s) => s.tenant?.id)
  const sucursalId = useAuthStore((s) => s.sucursal?.id)
  const taxRate = useAuthStore((s) => s.sucursal?.tax_rate)

  return useMemo(() => {
    if (!userId || !tenantId || !sucursalId) return null
    return {
      tenantId,
      sucursalId,
      userId,
      taxRate: (taxRate || 16) / 100,
    }
  }, [userId, tenantId, sucursalId, taxRate])
}
