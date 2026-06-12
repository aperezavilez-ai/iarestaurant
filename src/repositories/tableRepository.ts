import { tableService } from '@/services/tableService'
import { localDb } from '@/lib/localDb'
import { opsBroadcast } from '@/services/opsBroadcast'
import { withLocalFirst } from './base'
import type { RestaurantTable, Order } from '@/types'
import type { TenantContext } from '@/types/context'

async function getTableById(ctx: TenantContext, tableId: string) {
  const tables = await localDb.getTables(ctx.tenantId, ctx.sucursalId)
  return tables.find(t => t.id === tableId)
}

export const tableRepository = {
  async getTables(ctx: TenantContext): Promise<RestaurantTable[]> {
    return withLocalFirst(
      () => localDb.getTables(ctx.tenantId, ctx.sucursalId),
      () => tableService.getTables(ctx.tenantId, ctx.sucursalId)
    )
  },

  async getTableOrder(ctx: TenantContext, tableId: string): Promise<Order | null> {
    const orders = await localDb.getActiveOrders(ctx.tenantId, ctx.sucursalId)
    return orders.find(o => o.table_id === tableId) ?? null
  },

  async updateTable(table: RestaurantTable): Promise<void> {
    await localDb.updateTable(table)
    opsBroadcast.notify()
    try {
      await tableService.updateTableStatus(table.id, table.status, table.current_order_id)
    } catch { /* sync */ }
  },

  async updateStatus(
    ctx: TenantContext,
    tableId: string,
    status: RestaurantTable['status'],
    orderId?: string | null
  ): Promise<void> {
    const table = await getTableById(ctx, tableId)
    if (!table) return
    const updated: RestaurantTable = {
      ...table,
      status,
      current_order_id: orderId ?? undefined,
      opened_at: status === 'ocupada' && !table.opened_at ? new Date().toISOString() : status === 'libre' ? undefined : table.opened_at,
    }
    await localDb.updateTable(updated)
    opsBroadcast.notify()
    try {
      await tableService.updateTableStatus(tableId, status, orderId ?? undefined)
    } catch { /* sync */ }
  },

  async openTable(ctx: TenantContext, tableId: string): Promise<void> {
    const table = await getTableById(ctx, tableId)
    if (!table) throw new Error('Mesa no encontrada')
    if (table.status !== 'libre' && table.status !== 'reservada') throw new Error('Mesa no disponible')
    await localDb.updateTable({
      ...table,
      status: 'ocupada',
      opened_at: new Date().toISOString(),
    })
    opsBroadcast.notify()
  },

  async transferTable(ctx: TenantContext, fromId: string, toId: string): Promise<void> {
    const [from, to] = await Promise.all([
      getTableById(ctx, fromId),
      getTableById(ctx, toId),
    ])
    if (!from || !to) throw new Error('Mesa no encontrada')
    if (to.status !== 'libre') throw new Error('Mesa destino ocupada')

    const orders = await localDb.getActiveOrders(ctx.tenantId, ctx.sucursalId)
    const order = orders.find(o => o.table_id === fromId)
    if (order) {
      await localDb.updateOrder({ ...order, table_id: toId, updated_at: new Date().toISOString() })
    }

    await localDb.updateTable({
      ...to,
      status: from.status,
      current_order_id: from.current_order_id,
      assigned_waiter_id: from.assigned_waiter_id,
      opened_at: from.opened_at,
    })
    await localDb.updateTable({
      ...from,
      status: 'libre',
      current_order_id: undefined,
      assigned_waiter_id: undefined,
      opened_at: undefined,
    })
    opsBroadcast.notify()
  },

  async mergeTables(ctx: TenantContext, sourceId: string, targetId: string): Promise<void> {
    const [source, target] = await Promise.all([
      getTableById(ctx, sourceId),
      getTableById(ctx, targetId),
    ])
    if (!source || !target) throw new Error('Mesa no encontrada')
    if (sourceId === targetId) throw new Error('Selecciona mesas distintas')

    const orders = await localDb.getActiveOrders(ctx.tenantId, ctx.sucursalId)
    const sourceOrder = orders.find(o => o.table_id === sourceId)
    const targetOrder = orders.find(o => o.table_id === targetId)

    if (sourceOrder && targetOrder) {
      const items = targetOrder.items || []
      for (const item of sourceOrder.items || []) {
        await localDb.updateOrderItem({ ...item, order_id: targetOrder.id })
        items.push({ ...item, order_id: targetOrder.id })
      }
      const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
      const tax = subtotal * (ctx.taxRate ?? 0.16)
      await localDb.updateOrder({
        ...targetOrder,
        subtotal,
        tax,
        total: subtotal + tax,
        guests: (targetOrder.guests || 1) + (sourceOrder.guests || 1),
        updated_at: new Date().toISOString(),
      })
      await localDb.updateOrder({ ...sourceOrder, status: 'cancelada', updated_at: new Date().toISOString() })
    } else if (sourceOrder) {
      await localDb.updateOrder({ ...sourceOrder, table_id: targetId, updated_at: new Date().toISOString() })
    }

    await localDb.updateTable({
      ...target,
      status: 'ocupada',
      current_order_id: targetOrder?.id || sourceOrder?.id,
      opened_at: target.opened_at || source.opened_at || new Date().toISOString(),
    })
    await localDb.updateTable({
      ...source,
      status: 'libre',
      current_order_id: undefined,
      assigned_waiter_id: undefined,
      opened_at: undefined,
    })
    opsBroadcast.notify()
  },
}
