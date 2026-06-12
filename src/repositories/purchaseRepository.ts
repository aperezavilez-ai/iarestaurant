import { useOpsDataStore } from '@/store/opsDataStore'
import type { PurchaseOrder, Supplier } from '@/types/demo'

export const purchaseRepository = {
  getPurchases(): PurchaseOrder[] {
    useOpsDataStore.getState().resetIfEmpty()
    return useOpsDataStore.getState().purchases
  },

  getSuppliers(): Supplier[] {
    return useOpsDataStore.getState().suppliers
  },

  async receiveOrder(id: string): Promise<void> {
    useOpsDataStore.getState().updatePurchaseStatus(id, 'recibida')
  },

  async cancelOrder(id: string): Promise<void> {
    useOpsDataStore.getState().updatePurchaseStatus(id, 'cancelada')
  },
}
