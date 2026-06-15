import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PaymentGatewayId } from '@/data/paymentGateways'

interface PaymentGatewayState {
  byTenant: Record<string, PaymentGatewayId | null>
  setPreferred: (tenantId: string, gateway: PaymentGatewayId | null) => void
  getPreferred: (tenantId: string) => PaymentGatewayId | null
}

export const usePaymentGatewayStore = create<PaymentGatewayState>()(
  persist(
    (set, get) => ({
      byTenant: {},
      setPreferred: (tenantId, gateway) =>
        set((s) => ({ byTenant: { ...s.byTenant, [tenantId]: gateway } })),
      getPreferred: (tenantId) => get().byTenant[tenantId] ?? null,
    }),
    { name: 'ia-restaurant-payment-gateways' },
  ),
)
