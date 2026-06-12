import { cashService } from '@/services/cashService'
import { localDb } from '@/lib/localDb'
import { withLocalFirst } from './base'
import { buildSeedCashRegister } from '@/data/seed'
import type { CashRegister } from '@/types'
import type { TenantContext } from '@/types/context'

export const cashRepository = {
  async getOpenRegister(ctx: TenantContext): Promise<CashRegister | null> {
    return withLocalFirst(
      () => localDb.getOpenCashRegister(ctx.tenantId, ctx.sucursalId),
      async () => (await cashService.getOpenRegister(ctx.tenantId, ctx.sucursalId)) ?? null
    )
  },

  async openRegister(ctx: TenantContext, openingAmount: number): Promise<CashRegister> {
    const existing = await localDb.getOpenCashRegister(ctx.tenantId, ctx.sucursalId)
    if (existing) throw new Error('Ya hay una caja abierta')

    const register: CashRegister = {
      ...buildSeedCashRegister(ctx.userId),
      id: crypto.randomUUID(),
      opening_amount: openingAmount,
      opened_at: new Date().toISOString(),
    }
    await localDb.saveCashRegister(register)
    try {
      await cashService.openRegister(register)
    } catch { /* sync */ }
    return register
  },

  async closeRegister(
    ctx: TenantContext,
    registerId: string,
    closingAmount: number,
    expectedAmount: number
  ): Promise<CashRegister> {
    const all = await localDb.getOpenCashRegister(ctx.tenantId, ctx.sucursalId)
    if (!all || all.id !== registerId) throw new Error('Caja no encontrada')

    const closed: CashRegister = {
      ...all,
      closing_amount: closingAmount,
      expected_amount: expectedAmount,
      difference: closingAmount - expectedAmount,
      status: 'cerrada',
      closed_at: new Date().toISOString(),
    }
    await localDb.saveCashRegister(closed)
    try {
      await cashService.closeRegister(registerId, closed)
    } catch { /* sync */ }
    return closed
  },
}
