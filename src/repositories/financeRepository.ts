import { localDb } from '@/lib/localDb'
import { purchaseRepository } from '@/repositories/purchaseRepository'
import { invoiceRepository } from '@/repositories/invoiceRepository'
import { inventoryRepository } from '@/repositories/inventoryRepository'
import type { TenantContext } from '@/types/context'

export const financeRepository = {
  async getSnapshot(ctx: TenantContext) {
    const orders = await localDb.getOrders(ctx.tenantId, ctx.sucursalId)
    const month = new Date().toISOString().slice(0, 7)
    const monthSales = orders
      .filter(o => o.status === 'cobrada' && o.created_at.startsWith(month))
      .reduce((s, o) => s + o.total, 0)

    const monthCost = orders
      .filter(o => o.status === 'cobrada' && o.created_at.startsWith(month))
      .reduce((s, o) => s + (o.subtotal * 0.35), 0)

    const pendingInvoices = invoiceRepository.getAll().filter(i => i.status === 'pendiente')
    const accountsReceivable = pendingInvoices.reduce((s, i) => s + i.total, 0)

    const purchases = purchaseRepository.getPurchases()
    const accountsPayable = purchases
      .filter(p => p.status === 'pendiente' || p.status === 'parcial')
      .reduce((s, p) => s + p.total, 0)

    const inventoryValue = inventoryRepository.getInventoryValue()
    const margin = monthSales > 0 ? ((monthSales - monthCost) / monthSales) * 100 : 0

    return {
      accountsReceivable,
      accountsPayable,
      cashFlowMonth: monthSales,
      margin: Math.round(margin),
      inventoryValue,
      pendingInvoices: pendingInvoices.length,
      pendingPurchases: purchases.filter(p => p.status === 'pendiente').length,
    }
  },

  getPayables() {
    return purchaseRepository.getPurchases().filter(p => p.status !== 'recibida' && p.status !== 'cancelada')
  },

  getReceivables() {
    return invoiceRepository.getAll().filter(i => i.status === 'pendiente')
  },
}
