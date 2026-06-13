import { jsPDF } from 'jspdf'
import { formatCurrency } from '@/lib/utils'

interface ReportPayload {
  tenantName?: string
  sucursalName?: string
  generatedAt: string
  summary: {
    weekSales: number
    weekOrders: number
    avgTicket: number
    cancelRate: number
    cancelled: number
  }
  weekly: { day: string; sales: number; orders: number }[]
  categories: { name: string; value: number; revenue: number }[]
  payments: { method: string; amount: number }[]
}

export function exportSalesReportPdf(data: ReportPayload): void {
  const doc = new jsPDF()
  const margin = 14
  let y = 20

  const line = (text: string, size = 10, bold = false) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(text, margin, y)
    y += size * 0.45 + 4
  }

  line('IA·RESTAURANT — Reporte de ventas', 16, true)
  if (data.tenantName) line(`${data.tenantName}${data.sucursalName ? ` · ${data.sucursalName}` : ''}`, 10)
  line(`Generado: ${data.generatedAt}`, 9)
  y += 4

  line('Resumen (7 días)', 12, true)
  line(`Ventas: ${formatCurrency(data.summary.weekSales)} · ${data.summary.weekOrders} órdenes`)
  line(`Ticket promedio: ${formatCurrency(data.summary.avgTicket)}`)
  line(`Cancelaciones: ${data.summary.cancelled} (${data.summary.cancelRate.toFixed(1)}%)`)

  y += 4
  line('Ventas por día', 12, true)
  for (const d of data.weekly) {
    line(`${d.day}: ${formatCurrency(d.sales)} (${d.orders} órdenes)`, 9)
    if (y > 270) {
      doc.addPage()
      y = 20
    }
  }

  y += 4
  line('Por categoría', 12, true)
  for (const c of data.categories) {
    line(`${c.name}: ${c.value}% · ${formatCurrency(c.revenue)}`, 9)
    if (y > 270) {
      doc.addPage()
      y = 20
    }
  }

  if (data.payments.length) {
    y += 4
    line('Métodos de pago', 12, true)
    for (const p of data.payments) {
      line(`${p.method}: ${formatCurrency(p.amount)}`, 9)
    }
  }

  const stamp = new Date().toISOString().slice(0, 10)
  doc.save(`reporte-ventas-${stamp}.pdf`)
}
