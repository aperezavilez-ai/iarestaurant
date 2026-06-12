import { useOpsDataStore } from '@/store/opsDataStore'
import type { Invoice } from '@/types/demo'
import type { Order } from '@/types'

const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i

export const CFDI_USOS = [
  { code: 'G03', label: 'G03 — Gastos en general' },
  { code: 'S01', label: 'S01 — Sin efectos fiscales' },
  { code: 'D10', label: 'D10 — Pagos por servicios educativos' },
]

export const invoiceRepository = {
  getAll(): Invoice[] {
    useOpsDataStore.getState().resetIfEmpty()
    return useOpsDataStore.getState().invoices
  },

  getByOrderId(orderId: string): Invoice | undefined {
    return this.getAll().find(i => i.order_id === orderId && i.status !== 'cancelada')
  },

  validateRfc(rfc: string): boolean {
    return RFC_PATTERN.test(rfc.trim().toUpperCase())
  },

  createFromOrder(
    order: Order,
    data: { rfc: string; razon_social: string; email?: string; uso_cfdi?: string }
  ): Invoice {
    const rfc = data.rfc.trim().toUpperCase()
    if (!this.validateRfc(rfc)) throw new Error('RFC inválido — formato SAT requerido')

    const existing = this.getByOrderId(order.id)
    if (existing) throw new Error(`Ya existe factura ${existing.folio} para esta orden`)

    return useOpsDataStore.getState().addInvoice({
      order_id: order.id,
      order_folio: order.folio,
      rfc,
      razon_social: data.razon_social,
      email: data.email,
      uso_cfdi: data.uso_cfdi || 'G03',
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
    })
  },

  async stamp(id: string): Promise<Invoice> {
    const store = useOpsDataStore.getState()
    const inv = store.invoices.find(i => i.id === id)
    if (!inv) throw new Error('Factura no encontrada')
    if (inv.status !== 'pendiente') throw new Error('Solo facturas pendientes pueden timbrarse')
    if (inv.rfc === 'PENDIENTE' || !this.validateRfc(inv.rfc)) {
      throw new Error('RFC válido requerido antes de timbrar')
    }

    await new Promise(r => setTimeout(r, 800))

    const uuid = crypto.randomUUID()
    const stamped: Partial<Invoice> = {
      status: 'timbrada',
      uuid,
      stamped_at: new Date().toISOString(),
    }
    store.updateInvoice(id, stamped)
    return { ...inv, ...stamped }
  },

  cancel(id: string, reason: string): void {
    const store = useOpsDataStore.getState()
    const inv = store.invoices.find(i => i.id === id)
    if (!inv) throw new Error('Factura no encontrada')
    if (inv.status !== 'timbrada') throw new Error('Solo facturas timbradas pueden cancelarse ante el SAT')

    store.updateInvoice(id, {
      status: 'cancelada',
      cancel_reason: reason,
      canceled_at: new Date().toISOString(),
    })
  },

  getXmlContent(inv: Invoice): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante Version="4.0" Folio="${inv.folio}" UUID="${inv.uuid || 'PENDIENTE'}" Total="${inv.total}">
  <cfdi:Emisor Rfc="IAR240101ABC" Nombre="IA-RESTAURANT S.A."/>
  <cfdi:Receptor Rfc="${inv.rfc}" Nombre="${inv.razon_social || ''}" UsoCFDI="${inv.uso_cfdi}"/>
</cfdi:Comprobante>`
  },
}
