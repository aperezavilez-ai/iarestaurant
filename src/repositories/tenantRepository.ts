import { tenantService } from '@/services/tenantService'
import { localDb } from '@/lib/localDb'
import { withLocalFirst } from './base'
import { isSupabaseConfigured } from '@/lib/config'
import type { Organization, Sucursal, Tenant } from '@/types'
import type { TenantContext } from '@/types/context'

export interface BusinessProfile {
  tenant: Tenant
  organization: Organization | null
  sucursal: Sucursal | null
}

export const tenantRepository = {
  async getBusinessProfile(ctx: TenantContext): Promise<BusinessProfile | null> {
    const [tenant, organization, sucursales] = await Promise.all([
      withLocalFirst(
        () => localDb.getTenant(ctx.tenantId),
        () => tenantService.getTenant(ctx.tenantId),
      ),
      withLocalFirst(
        () => localDb.getOrganization(ctx.tenantId),
        () => tenantService.getOrganization(ctx.tenantId),
      ),
      withLocalFirst(
        () => localDb.getSucursales(ctx.tenantId),
        () => tenantService.getSucursales(ctx.tenantId),
      ),
    ])

    if (!tenant) return null

    if (tenant) await localDb.saveTenant(tenant)
    if (organization) await localDb.saveOrganization(organization)
    for (const s of sucursales || []) await localDb.saveSucursal(s)

    const sucursal =
      sucursales?.find((s) => s.id === ctx.sucursalId) ||
      sucursales?.[0] ||
      (await localDb.getSucursal(ctx.sucursalId))

    return { tenant, organization: organization || null, sucursal: sucursal || null }
  },

  async updateBusiness(
    ctx: TenantContext,
    data: {
      tenantName: string
      rfc?: string
      phone?: string
      email?: string
      address?: string
    },
  ): Promise<BusinessProfile> {
    const tenant = await localDb.getTenant(ctx.tenantId)
    if (!tenant) throw new Error('Restaurante no encontrado')

    const updatedTenant: Tenant = { ...tenant, name: data.tenantName.trim() }
    await localDb.saveTenant(updatedTenant)

    let organization = await localDb.getOrganization(ctx.tenantId)
    if (organization) {
      organization = {
        ...organization,
        name: data.tenantName.trim(),
        rfc: data.rfc?.trim() || organization.rfc,
        phone: data.phone?.trim() || organization.phone,
        email: data.email?.trim() || organization.email,
        address: data.address?.trim() || organization.address,
      }
      await localDb.saveOrganization(organization)
    }

    if (isSupabaseConfigured()) {
      try {
        await tenantService.updateTenant(ctx.tenantId, { name: updatedTenant.name })
        if (organization) {
          await tenantService.updateOrganization(organization.id, {
            name: organization.name,
            rfc: organization.rfc,
            phone: organization.phone,
            email: organization.email,
            address: organization.address,
          })
        }
      } catch {
        await localDb.enqueueSync({
          table: 'tenants',
          operation: 'update',
          payload: updatedTenant as never,
        })
      }
    }

    const sucursal = await localDb.getSucursal(ctx.sucursalId)
    return { tenant: updatedTenant, organization: organization || null, sucursal: sucursal || null }
  },
}
