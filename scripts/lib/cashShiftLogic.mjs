/** Lógica de turno compartida por qa-smoke y qa-rehearsal */

export function isShiftStale(openedAt, now = new Date()) {
  const opened = new Date(openedAt)
  return (
    opened.getFullYear() !== now.getFullYear() ||
    opened.getMonth() !== now.getMonth() ||
    opened.getDate() !== now.getDate()
  )
}

export function computeShiftSummary(orders, payments, openedAt, until) {
  const since = new Date(openedAt).getTime()
  const untilTs = until ? new Date(until).getTime() : Infinity

  const shiftOrders = orders.filter((o) => {
    const ts = new Date(o.updated_at || o.created_at).getTime()
    return o.status === 'cobrada' && ts >= since && ts <= untilTs
  })

  const orderIds = new Set(shiftOrders.map((o) => o.id))
  const shiftPayments = payments.filter((p) => orderIds.has(p.order_id))

  const byMethod = { efectivo: 0, tarjeta: 0, transferencia: 0, mixto: 0 }
  let cashSales = 0

  for (const p of shiftPayments) {
    byMethod[p.method] = (byMethod[p.method] || 0) + p.amount
    if (p.method === 'efectivo') cashSales += p.amount
  }

  const totalSales = shiftOrders.reduce((s, o) => s + o.total, 0)
  const paymentsTotal = shiftPayments.reduce((s, p) => s + p.amount, 0)

  return {
    totalSales,
    orderCount: shiftOrders.length,
    byMethod,
    cashSales,
    paymentsTotal,
    shiftOrders,
    shiftPayments,
  }
}

export function computeExpectedCash(openingAmount, cashSales, movements) {
  const net = movements.reduce(
    (s, m) => s + (m.type === 'entrada' ? m.amount : -m.amount),
    0
  )
  return openingAmount + cashSales + net
}
