import { localDb } from '@/lib/localDb'
import { getProductCategory } from '@/lib/productionCenters'
import type { TenantContext } from '@/types/context'

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const CATEGORY_COLORS: Record<string, string> = {
  Tacos: '#F59E0B', Platillos: '#60A5FA', Entradas: '#34D399',
  Bebidas: '#22D3EE', Cocteles: '#A78BFA', Postres: '#EC4899',
}

export const reportsRepository = {
  async getSummary(ctx: TenantContext) {
    const orders = await localDb.getOrders(ctx.tenantId, ctx.sucursalId)
    const cobradas = orders.filter(o => o.status === 'cobrada')
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const weekOrders = cobradas.filter(o => new Date(o.created_at).getTime() >= weekAgo)
    const weekSales = weekOrders.reduce((s, o) => s + o.total, 0)
    const cancelled = orders.filter(o => o.status === 'cancelada').length

    return {
      weekSales,
      weekOrders: weekOrders.length,
      avgTicket: weekOrders.length ? weekSales / weekOrders.length : 0,
      cancelRate: orders.length ? (cancelled / orders.length) * 100 : 0,
      cancelled,
    }
  },

  async getWeeklySales(ctx: TenantContext) {
    const orders = await localDb.getOrders(ctx.tenantId, ctx.sucursalId)
    const cobradas = orders.filter(o => o.status === 'cobrada')
    const days: { day: string; sales: number; orders: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const dayOrders = cobradas.filter(o => o.created_at.startsWith(key))
      days.push({
        day: DAY_LABELS[d.getDay()],
        sales: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
      })
    }
    return days
  },

  async getCategoryBreakdown(ctx: TenantContext) {
    const orders = await localDb.getOrders(ctx.tenantId, ctx.sucursalId)
    const cobradas = orders.filter(o => o.status === 'cobrada')
    const map: Record<string, number> = {}

    for (const order of cobradas) {
      for (const item of order.items || []) {
        const cat = getProductCategory(item.product_id, item.product_name)
        map[cat] = (map[cat] || 0) + item.subtotal
      }
    }

    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1
    return Object.entries(map)
      .map(([name, revenue]) => ({
        name,
        value: Math.round((revenue / total) * 100),
        revenue,
        color: CATEGORY_COLORS[name] || '#94A3B8',
      }))
      .sort((a, b) => b.revenue - a.revenue)
  },

  async getPaymentBreakdown(ctx: TenantContext) {
    const payments = await localDb.getPayments(ctx.tenantId)
    const map: Record<string, number> = {}

    for (const p of payments) {
      const key = p.method
      map[key] = (map[key] || 0) + p.amount
    }
    return Object.entries(map).map(([method, amount]) => ({ method, amount }))
  },
}
