import { useOpsDataStore } from '@/store/opsDataStore'
import type { Customer, LoyaltyRule } from '@/types/demo'

export const crmRepository = {
  getCustomers(): Customer[] {
    useOpsDataStore.getState().resetIfEmpty()
    return useOpsDataStore.getState().customers
  },

  getCustomer(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id)
  },

  getBySegment(segment: Customer['segment']): Customer[] {
    return this.getCustomers().filter(c => c.segment === segment)
  },

  getLoyaltyRules(): LoyaltyRule[] {
    return useOpsDataStore.getState().loyaltyRules
  },

  addCustomer(data: {
    name: string
    email?: string
    phone?: string
  }): Customer {
    return useOpsDataStore.getState().addCustomer(data)
  },

  recordSale(customerId: string, amount: number): void {
    useOpsDataStore.getState().recordCustomerSale(customerId, amount)
  },

  redeemPoints(customerId: string, points: number): boolean {
    return useOpsDataStore.getState().redeemPoints(customerId, points)
  },

  search(query: string): Customer[] {
    const q = query.toLowerCase()
    return this.getCustomers().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  },
}
