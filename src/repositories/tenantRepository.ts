import { tenantService } from '@/services/tenantService'
import { localDb } from '@/lib/localDb'
import { withLocalFirst } from './base'
import { isSupabaseConfigured } from '@/lib/config'
import type { Organization, Sucursal, Tenant, PaymentConfig } from '@/types'
import type { TenantContext } from '@/types/context'

export interface BusinessProfile {
  tenant: Tenant
  organization: Organization | null
  sucursal: Sucursal | null
}

export interface BusinessSettingsInput {
  tenantName: string
  rfc?: string
  phone?: string
  email?: string
  address?: string
  whatsappAlerts?: string
  reportsEmail?: string
  timezone?: string
  currency?: string
  taxRate?: number
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

  async updateBusiness(ctx: TenantContext, data: BusinessSettingsInput): Promise<BusinessProfile> {
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
        whatsapp_alerts: data.whatsappAlerts?.trim() || organization.whatsapp_alerts,
        reports_email: data.reportsEmail?.trim() || organization.reports_email,
      }
      await localDb.saveOrganization(organization)
    }

    let sucursal = await localDb.getSucursal(ctx.sucursalId)
    if (sucursal && (data.timezone || data.currency || data.taxRate != null)) {
      sucursal = {
        ...sucursal,
        timezone: data.timezone?.trim() || sucursal.timezone,
        currency: data.currency?.trim() || sucursal.currency,
        tax_rate: data.taxRate ?? sucursal.tax_rate,
        phone: data.phone?.trim() || sucursal.phone,
        address: data.address?.trim() || sucursal.address,
      }
      await localDb.saveSucursal(sucursal)
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
            whatsapp_alerts: organization.whatsapp_alerts,
            reports_email: organization.reports_email,
          })
        }
        if (sucursal) {
          await tenantService.updateSucursal(sucursal.id, {
            timezone: sucursal.timezone,
            currency: sucursal.currency,
            tax_rate: sucursal.tax_rate,
            phone: sucursal.phone,
            address: sucursal.address,
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

    return { tenant: updatedTenant, organization: organization || null, sucursal: sucursal || null }
  },

  async getPaymentConfig(ctx: TenantContext): Promise<PaymentConfig> {
    const profile = await this.getBusinessProfile(ctx)
    return profile?.organization?.payment_config || {}
  },

  async updatePaymentConfig(ctx: TenantContext, config: PaymentConfig): Promise<PaymentConfig> {
    let organization = await localDb.getOrganization(ctx.tenantId)
    if (!organization) throw new Error('Organización no encontrada')

    organization = { ...organization, payment_config: config }
    await localDb.saveOrganization(organization)

    if (isSupabaseConfigured()) {
      try {
        await tenantService.updateOrganization(organization.id, { payment_config: config })
      } catch {
        await localDb.enqueueSync({
          table: 'organizations',
          operation: 'update',
          payload: organization as never,
        })
      }
    }
    return config
  },
}
