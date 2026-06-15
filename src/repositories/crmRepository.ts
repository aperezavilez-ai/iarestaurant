import { crmService } from '@/services/crmService'
import { localDb } from '@/lib/localDb'
import { withHybridList } from './base'
import { isSupabaseConfigured } from '@/lib/config'
import { withTimeout } from '@/lib/async'
import { useOpsDataStore } from '@/store/opsDataStore'
import type { Customer, LoyaltyRule } from '@/types/demo'
import type { TenantContext } from '@/types/context'

const DEFAULT_LOYALTY_RULES: LoyaltyRule[] = [
  { id: 'lr1', name: '1 punto por cada $10', points_per_amount: 1, amount_threshold: 10, active: true },
  { id: 'lr2', name: '100 puntos = $50 descuento', points_per_amount: 0, amount_threshold: 100, active: true },
  { id: 'lr3', name: 'Doble puntos martes', points_per_amount: 2, amount_threshold: 10, active: true },
]

function calcSegment(visits: number, total: number): Customer['segment'] {
  if (visits >= 15 || total >= 8000) return 'vip'
  if (visits >= 5 || total >= 2000) return 'frecuente'
  return 'nuevo'
}

function pointsForSale(amount: number): number {
  const isTuesday = new Date().getDay() === 2
  const multiplier = isTuesday ? 2 : 1
  return Math.floor(amount / 10) * multiplier
}

async function remoteCustomers(tenantId: string) {
  return withTimeout(crmService.getCustomers(tenantId)).catch(() => [] as Customer[])
}

export const crmRepository = {
  async getCustomers(ctx: TenantContext): Promise<Customer[]> {
    return withHybridList(
      () => localDb.getCustomers(ctx.tenantId),
      () => remoteCustomers(ctx.tenantId)
    )
  },

  async getCustomer(ctx: TenantContext, id: string): Promise<Customer | undefined> {
    const customers = await this.getCustomers(ctx)
    return customers.find(c => c.id === id)
  },

  async getBySegment(ctx: TenantContext, segment: Customer['segment']): Promise<Customer[]> {
    const customers = await this.getCustomers(ctx)
    return customers.filter(c => c.segment === segment)
  },

  getLoyaltyRules(): LoyaltyRule[] {
    return useOpsDataStore.getState().loyaltyRules.length
      ? useOpsDataStore.getState().loyaltyRules
      : DEFAULT_LOYALTY_RULES
  },

  async addCustomer(
    ctx: TenantContext,
    data: { name: string; email?: string; phone?: string }
  ): Promise<Customer> {
    const name = data.name.trim()
    if (!name) throw new Error('El nombre es obligatorio')

    const existing = await this.getCustomers(ctx)
    const phone = data.phone?.trim()
    const email = data.email?.trim().toLowerCase()
    if (phone && existing.some(c => c.phone === phone)) {
      throw new Error('Ya existe un cliente con ese teléfono')
    }
    if (email && existing.some(c => c.email?.toLowerCase() === email)) {
      throw new Error('Ya existe un cliente con ese email')
    }

    const customer: Customer = {
      id: crypto.randomUUID(),
      tenant_id: ctx.tenantId,
      sucursal_id: ctx.sucursalId,
      name,
      email: email || undefined,
      phone: phone || undefined,
      visits: 0,
      points: 0,
      total_spent: 0,
      segment: 'nuevo',
      created_at: new Date().toISOString().slice(0, 10),
    }

    await localDb.saveCustomer(customer)
    if (isSupabaseConfigured()) {
      try {
        await crmService.createCustomer(customer)
      } catch {
        await localDb.enqueueSync({ table: 'customers', operation: 'insert', payload: customer as never })
      }
    }
    return customer
  },

  async recordSale(ctx: TenantContext, customerId: string, amount: number): Promise<Customer | null> {
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Monto inválido')

    const customer = await this.getCustomer(ctx, customerId)
    if (!customer) return null

    const visits = customer.visits + 1
    const total_spent = customer.total_spent + amount
    const updated: Customer = {
      ...customer,
      visits,
      total_spent,
      points: customer.points + pointsForSale(amount),
      segment: calcSegment(visits, total_spent),
    }

    await localDb.updateCustomer(updated)
    if (isSupabaseConfigured()) {
      try {
        await crmService.updateCustomer(customerId, updated)
      } catch {
        await localDb.enqueueSync({ table: 'customers', operation: 'update', payload: updated as never })
      }
    }
    return updated
  },

  async redeemPoints(ctx: TenantContext, customerId: string, points: number): Promise<Customer | null> {
    const customer = await this.getCustomer(ctx, customerId)
    if (!customer || customer.points < points) return null

    const updated: Customer = { ...customer, points: customer.points - points }
    await localDb.updateCustomer(updated)
    if (isSupabaseConfigured()) {
      try {
        await crmService.updateCustomer(customerId, { points: updated.points })
      } catch {
        await localDb.enqueueSync({ table: 'customers', operation: 'update', payload: updated as never })
      }
    }
    return updated
  },

  async search(ctx: TenantContext, query: string): Promise<Customer[]> {
    const q = query.trim().toLowerCase()
    if (!q) return this.getCustomers(ctx)
    const customers = await this.getCustomers(ctx)
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  },
}
