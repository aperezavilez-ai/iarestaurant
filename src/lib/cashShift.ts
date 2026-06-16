import type { Order, Payment, PaymentMethod } from '@/types'

export interface ShiftSummary {
  totalSales: number
  orderCount: number
  byMethod: Record<PaymentMethod, number>
  cashSales: number
}

const EMPTY_METHODS: Record<PaymentMethod, number> = {
  efectivo: 0,
  tarjeta: 0,
  transferencia: 0,
  mixto: 0,
}

export function computeShiftSummary(
  orders: Order[],
  payments: Payment[],
  openedAt: string
): ShiftSummary {
  const since = new Date(openedAt).getTime()
  const shiftOrders = orders.filter(
    (o) =>
      o.status === 'cobrada' &&
      new Date(o.updated_at || o.created_at).getTime() >= since
  )
  const orderIds = new Set(shiftOrders.map((o) => o.id))
  const shiftPayments = payments.filter((p) => orderIds.has(p.order_id))

  const byMethod = { ...EMPTY_METHODS }
  let cashSales = 0

  for (const p of shiftPayments) {
    byMethod[p.method] = (byMethod[p.method] || 0) + p.amount
    if (p.method === 'efectivo') cashSales += p.amount
  }

  const totalSales = shiftOrders.reduce((s, o) => s + o.total, 0)

  return {
    totalSales,
    orderCount: shiftOrders.length,
    byMethod,
    cashSales,
  }
}

export interface CashCutPrintData {
  type: 'X' | 'Z'
  tenantName: string
  sucursalName: string
  cashierName: string
  openedAt: string
  closedAt?: string
  openingAmount: number
  totalSales: number
  orderCount: number
  cashSales: number
  cardSales: number
  digitalSales: number
  movementsNet: number
  expectedCash: number
  countedCash?: number
  difference?: number
  cutNumber?: number
}

export function printCashCutTicket(data: CashCutPrintData) {
  const fmt = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
  const dt = (iso: string) => new Date(iso).toLocaleString('es-MX')

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/><title>Corte ${data.type}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; max-width: 320px; margin: 0 auto; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #999; margin: 8px 0; padding-top: 8px; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .title { font-size: 14px; font-weight: bold; }
  .diff-ok { color: green; }
  .diff-bad { color: red; }
  @media print { body { padding: 0; } }
</style></head><body>
  <p class="center title">${data.tenantName}</p>
  <p class="center">${data.sucursalName}</p>
  <p class="center bold" style="margin-top:8px">CORTE ${data.type}${data.cutNumber ? ` #${data.cutNumber}` : ''}</p>
  <div class="line">
    <div class="row"><span>Cajero</span><span>${data.cashierName}</span></div>
    <div class="row"><span>Apertura</span><span>${dt(data.openedAt)}</span></div>
    ${data.closedAt ? `<div class="row"><span>Cierre</span><span>${dt(data.closedAt)}</span></div>` : ''}
  </div>
  <div class="line">
    <div class="row"><span>Fondo apertura</span><span>${fmt(data.openingAmount)}</span></div>
    <div class="row"><span>Ventas turno (${data.orderCount})</span><span>${fmt(data.totalSales)}</span></div>
    <div class="row"><span>· Efectivo</span><span>${fmt(data.cashSales)}</span></div>
    <div class="row"><span>· Tarjeta</span><span>${fmt(data.cardSales)}</span></div>
    <div class="row"><span>· Digital</span><span>${fmt(data.digitalSales)}</span></div>
    ${data.movementsNet !== 0 ? `<div class="row"><span>Movimientos</span><span>${fmt(data.movementsNet)}</span></div>` : ''}
  </div>
  <div class="line">
    <div class="row bold"><span>Efectivo esperado</span><span>${fmt(data.expectedCash)}</span></div>
    ${data.countedCash != null ? `<div class="row"><span>Efectivo contado</span><span>${fmt(data.countedCash)}</span></div>` : ''}
    ${data.difference != null ? `<div class="row bold ${data.difference === 0 ? 'diff-ok' : 'diff-bad'}"><span>Diferencia</span><span>${fmt(data.difference)}</span></div>` : ''}
  </div>
  <p class="center" style="margin-top:12px;font-size:10px;color:#666">
    ${data.type === 'Z' ? 'CIERRE DE TURNO — CAJA CERRADA' : 'CORTE PARCIAL — CAJA ABIERTA'}
  </p>
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script>
</body></html>`

  const w = window.open('', '_blank', 'width=400,height=600')
  if (!w) return false
  w.document.write(html)
  w.document.close()
  return true
}
