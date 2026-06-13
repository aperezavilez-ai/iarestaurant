import { localDb } from '@/lib/localDb'
import { orderRepository } from '@/repositories/orderRepository'
import { tableRepository } from '@/repositories/tableRepository'
import type { DashboardStats } from '@/types'
import type { TenantContext } from '@/types/context'

export const dashboardRepository = {
  async getStats(ctx: TenantContext): Promise<DashboardStats> {
    const [orders, tables] = await Promise.all([
      orderRepository.getAllOrders(ctx),
      tableRepository.getTables(ctx),
    ])
    const today = new Date().toISOString().slice(0, 10)

    const todayOrders = orders.filter(
      (o) => o.status === 'cobrada' && o.created_at.startsWith(today)
    )
    const todaySales = todayOrders.reduce((s, o) => s + o.total, 0)
    const activeTables = tables.filter((t) => t.status === 'ocupada' || t.status === 'cobro_pendiente').length
    const pendingOrders = orders.filter((o) => ['abierta', 'en_preparacion', 'lista'].includes(o.status)).length

    const productCounts: Record<string, { count: number; revenue: number }> = {}
    for (const order of todayOrders) {
      for (const item of order.items || []) {
        if (!productCounts[item.product_name]) {
          productCounts[item.product_name] = { count: 0, revenue: 0 }
        }
        productCounts[item.product_name].count += item.quantity
        productCounts[item.product_name].revenue += item.subtotal
      }
    }

    const top_products = Object.entries(productCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const hourlyMap: Record<string, number> = {}
    for (let h = 8; h <= 22; h++) {
      hourlyMap[`${h.toString().padStart(2, '0')}h`] = 0
    }
    for (const order of todayOrders) {
      const hour = new Date(order.created_at).getHours()
      const key = `${hour.toString().padStart(2, '0')}h`
      if (hourlyMap[key] !== undefined) hourlyMap[key] += order.total
    }

    return {
      today_sales: todaySales,
      today_orders: todayOrders.length,
      active_tables: activeTables,
      total_tables: tables.length,
      avg_ticket: todayOrders.length ? todaySales / todayOrders.length : 0,
      pending_orders: pendingOrders,
      top_products,
      hourly_sales: Object.entries(hourlyMap).map(([hour, amount]) => ({ hour, amount })),
    }
  },

  async getActiveOrdersForTable(ctx: TenantContext) {
    const orders = await orderRepository.getActiveOrders(ctx)
    const tables = await tableRepository.getTables(ctx)
    return orders.map((o) => {
      const table = tables.find((t) => t.id === o.table_id)
      const mins = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000)
      const itemStatus = o.items?.every((i) => i.status === 'listo')
        ? 'listo'
        : o.items?.some((i) => i.status === 'preparando')
          ? 'preparando'
          : 'pendiente'
      return {
        folio: o.folio,
        table: table ? `Mesa ${table.number}` : 'Mostrador',
        status: itemStatus,
        time: `${mins} min`,
        total: o.total,
        orderId: o.id,
      }
    })
  },
}
