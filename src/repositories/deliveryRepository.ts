import { useOpsDataStore } from '@/store/opsDataStore'
import { orderRepository } from '@/repositories/orderRepository'
import { opsBroadcast } from '@/services/opsBroadcast'
import type { DeliveryOrder } from '@/types/demo'
import type { TenantContext } from '@/types/context'

export const DELIVERY_DRIVERS = ['Miguel R.', 'Ana V.', 'Luis G.']

const STATUS_FLOW: DeliveryOrder['status'][] = ['recibido', 'preparando', 'en_camino', 'entregado']

export const deliveryRepository = {
  getAll(): DeliveryOrder[] {
    useOpsDataStore.getState().resetIfEmpty()
    return useOpsDataStore.getState().deliveries
  },

  getActive(): DeliveryOrder[] {
    return this.getAll().filter(d => !['entregado', 'cancelado'].includes(d.status))
  },

  async create(data: {
    customer_name: string
    phone?: string
    address: string
    total: number
    notes?: string
  }): Promise<DeliveryOrder> {
    return useOpsDataStore.getState().addDelivery(data)
  },

  async advanceStatus(id: string): Promise<DeliveryOrder | null> {
    const store = useOpsDataStore.getState()
    const d = store.deliveries.find(x => x.id === id)
    if (!d) return null
    const idx = STATUS_FLOW.indexOf(d.status)
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return d
    const next = STATUS_FLOW[idx + 1]
    store.updateDelivery(id, { status: next })
    return { ...d, status: next }
  },

  assignDriver(id: string, driver: string): void {
    useOpsDataStore.getState().updateDelivery(id, { driver })
  },

  cancel(id: string): void {
    useOpsDataStore.getState().updateDelivery(id, { status: 'cancelado' })
  },

  async sendToKitchen(ctx: TenantContext, deliveryId: string): Promise<void> {
    const d = this.getAll().find(x => x.id === deliveryId)
    if (!d || d.order_id) return

    const order = await orderRepository.sendToKitchen(ctx, [{
      product_id: 'p3',
      product_name: `Delivery — ${d.customer_name}`,
      quantity: 1,
      unit_price: d.total,
      notes: d.address,
    }])
    useOpsDataStore.getState().updateDelivery(deliveryId, {
      order_id: order.id,
      status: 'preparando',
    })
    opsBroadcast.notify()
  },
}
