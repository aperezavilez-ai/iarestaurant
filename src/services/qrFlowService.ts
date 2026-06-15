import { localDb } from '@/lib/localDb'
import { generateFolio } from '@/lib/utils'
import { DEMO_SUCURSAL_ID, DEMO_TENANT_ID, isSupabaseConfigured } from '@/lib/config'
import { orderService } from '@/services/orderService'
import { tableService } from '@/services/tableService'
import type { QROrder } from '@/types/qrFlow'
import type { Order, OrderItem } from '@/types'

export const qrFlowService = {
  async pushToKitchen(qrOrder: QROrder): Promise<string> {
    await localDb.ensureLocalSeed()
    const orderId = crypto.randomUUID()
    const now = new Date().toISOString()

    const order: Order = {
      id: orderId,
      tenant_id: DEMO_TENANT_ID,
      sucursal_id: DEMO_SUCURSAL_ID,
      table_id: qrOrder.table_id,
      folio: qrOrder.folio,
      status: 'en_preparacion',
      waiter_id: qrOrder.waiter_id,
      subtotal: qrOrder.subtotal,
      tax: qrOrder.tax,
      discount: 0,
      total: qrOrder.total,
      guests: 1,
      notes: 'Pedido QR',
      created_at: now,
      updated_at: now,
    }

    const items: OrderItem[] = qrOrder.items.map((item) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
      status: 'pendiente' as const,
      notes: item.notes,
    }))

    await localDb.saveOrder({ ...order, items }, items)

    const tables = await localDb.getTables(DEMO_TENANT_ID, DEMO_SUCURSAL_ID)
    const table = tables.find((t) => t.id === qrOrder.table_id)
    if (table) {
      await localDb.updateTable({
        ...table,
        status: 'ocupada',
        current_order_id: orderId,
        assigned_waiter_id: qrOrder.waiter_id,
        opened_at: table.opened_at || now,
      })
    }

    if (isSupabaseConfigured()) {
      try {
        const remote = await orderService.createOrder(order, items)
        if (table) {
          await tableService.updateTableStatus(table.id, 'ocupada', remote.id)
        }
        return remote.id
      } catch {
        // Local copy already saved; sync queue may retry later
      }
    }

    return orderId
  },

  generateFolio() {
    return generateFolio()
  },
}
