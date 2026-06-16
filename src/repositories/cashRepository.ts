import { cashService } from '@/services/cashService'
import { paymentService } from '@/services/paymentService'
import { localDb } from '@/lib/localDb'
import { isSupabaseConfigured } from '@/lib/config'
import { computeShiftSummary, type ShiftSummary } from '@/lib/cashShift'
import { isOnline } from './base'
import { orderRepository } from './orderRepository'
import { buildSeedCashRegister } from '@/data/seed'
import type { CashRegister } from '@/types'
import type { TenantContext } from '@/types/context'

export const cashRepository = {
  async getOpenRegister(ctx: TenantContext): Promise<CashRegister | null> {
    const local = await localDb.getOpenCashRegister(ctx.tenantId, ctx.sucursalId)
    if (!isSupabaseConfigured() || !isOnline()) return local
    try {
      const remote = await cashService.getOpenRegister(ctx.tenantId, ctx.sucursalId)
      return remote ?? local
    } catch {
      return local
    }
  },

  async openRegister(ctx: TenantContext, openingAmount: number): Promise<CashRegister> {
    const existing = await this.getOpenRegister(ctx)
    if (existing) throw new Error('Ya hay una caja abierta')

    const register: CashRegister = {
      ...buildSeedCashRegister(ctx.userId),
      id: crypto.randomUUID(),
      opening_amount: openingAmount,
      opened_at: new Date().toISOString(),
    }
    await localDb.saveCashRegister(register)
    if (isSupabaseConfigured()) {
      try {
        await cashService.openRegister(register)
      } catch {
        await localDb.enqueueSync({
          table: 'cash_registers',
          operation: 'insert',
          payload: register as never,
        })
      }
    }
    return register
  },

  async closeRegister(
    ctx: TenantContext,
    registerId: string,
    closingAmount: number,
    expectedAmount: number
  ): Promise<CashRegister> {
    const existing = await this.getOpenRegister(ctx)
    if (!existing || existing.id !== registerId) throw new Error('Caja no encontrada')

    const closed: CashRegister = {
      ...existing,
      closing_amount: closingAmount,
      expected_amount: expectedAmount,
      difference: closingAmount - expectedAmount,
      status: 'cerrada',
      closed_at: new Date().toISOString(),
    }
    await localDb.saveCashRegister(closed)
    if (isSupabaseConfigured()) {
      try {
        await cashService.closeRegister(registerId, closed)
      } catch {
        await localDb.enqueueSync({
          table: 'cash_registers',
          operation: 'update',
          payload: closed as never,
        })
      }
    }
    return closed
  },

  async getShiftSummary(ctx: TenantContext, openedAt: string): Promise<ShiftSummary> {
    const orders = await orderRepository.getAllOrders(ctx)
    let payments = await localDb.getPayments(ctx.tenantId)
    if (isSupabaseConfigured() && isOnline()) {
      try {
        const remote = await paymentService.getPaymentsByTenant(ctx.tenantId)
        const localIds = new Set(payments.map((p) => p.id))
        for (const p of remote) {
          if (!localIds.has(p.id)) payments.push(p)
        }
      } catch {
        /* local-first */
      }
    }
    return computeShiftSummary(orders, payments, openedAt)
  },
}
