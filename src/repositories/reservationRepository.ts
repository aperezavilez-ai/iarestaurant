import { useOpsDataStore } from '@/store/opsDataStore'
import { tableRepository } from '@/repositories/tableRepository'
import type { Reservation, WaitlistEntry } from '@/types/demo'
import type { TenantContext } from '@/types/context'

export const reservationRepository = {
  getAll(): Reservation[] {
    useOpsDataStore.getState().resetIfEmpty()
    return useOpsDataStore.getState().reservations
  },

  getByDate(date: string): Reservation[] {
    return this.getAll().filter(r => r.date === date && r.status !== 'cancelada')
  },

  getWaitlist(): WaitlistEntry[] {
    return useOpsDataStore.getState().waitlist
  },

  async create(
    data: Omit<Reservation, 'id' | 'tenant_id' | 'created_at' | 'status'> & { status?: Reservation['status'] }
  ): Promise<Reservation> {
    return useOpsDataStore.getState().addReservation(data)
  },

  async confirm(ctx: TenantContext, id: string, tableNumber?: number): Promise<void> {
    const store = useOpsDataStore.getState()
    const res = store.reservations.find(r => r.id === id)
    if (!res) return

    let tableId: string | undefined
    if (tableNumber) {
      const tables = await tableRepository.getTables(ctx)
      const table = tables.find(t => t.number === tableNumber)
      if (table) {
        tableId = table.id
        await tableRepository.updateStatus(ctx, table.id, 'reservada')
      }
    }

    store.updateReservation(id, {
      status: 'confirmada',
      table_number: tableNumber,
      table_id: tableId,
    })
  },

  async cancel(ctx: TenantContext, id: string): Promise<void> {
    const store = useOpsDataStore.getState()
    const res = store.reservations.find(r => r.id === id)
    if (res?.table_id) {
      await tableRepository.updateStatus(ctx, res.table_id, 'libre')
    }
    store.updateReservation(id, { status: 'cancelada' })
  },

  async seat(ctx: TenantContext, id: string): Promise<void> {
    const store = useOpsDataStore.getState()
    const res = store.reservations.find(r => r.id === id)
    if (!res?.table_id) return
    await tableRepository.openTable(ctx, res.table_id)
    store.updateReservation(id, { status: 'completada' })
  },

  addToWaitlist(data: { customer_name: string; guests: number; phone?: string }): WaitlistEntry {
    const wait = useOpsDataStore.getState().waitlist.length
    return useOpsDataStore.getState().addWaitlist({
      ...data,
      estimated_wait: 10 + wait * 8,
    })
  },

  removeFromWaitlist(id: string): void {
    useOpsDataStore.getState().removeWaitlist(id)
  },
}
