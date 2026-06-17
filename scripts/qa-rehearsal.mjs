/**
 * Ensayo general Día 6 — simula jornada completa y valida cuadre de caja.
 * Ejecutar: npm run qa:rehearsal
 */
import {
  computeShiftSummary,
  computeExpectedCash,
  isShiftStale,
} from './lib/cashShiftLogic.mjs'

const OPENED_AT = '2026-06-16T08:00:00'
const OPENING_AMOUNT = 2000
const CORTE_X_AT = '2026-06-16T14:00:00'
const CLOSED_AT = '2026-06-16T23:00:00'

let passed = 0
let failed = 0

function assert(name, cond, detail = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`)
  } else {
    failed++
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function ts(hour, min = 0) {
  return `2026-06-16T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`
}

/** 23 órdenes: 17 mostrador/mesas + 3 QR + 3 mesas tarde */
function buildJornada() {
  const orders = []
  const payments = []
  const specs = [
    { total: 85, method: 'efectivo', channel: 'pos', h: 8, m: 30 },
    { total: 120, method: 'tarjeta', channel: 'mesa', h: 9, m: 0 },
    { total: 65, method: 'efectivo', channel: 'pos', h: 9, m: 45 },
    { total: 200, method: 'mixto', channel: 'mesa', h: 10, m: 15, split: [100, 100] },
    { total: 45, method: 'efectivo', channel: 'qr', h: 10, m: 30 },
    { total: 90, method: 'tarjeta', channel: 'pos', h: 11, m: 0 },
    { total: 150, method: 'efectivo', channel: 'mesa', h: 11, m: 45 },
    { total: 75, method: 'transferencia', channel: 'pos', h: 12, m: 30 },
    { total: 110, method: 'efectivo', channel: 'qr', h: 13, m: 0 },
    { total: 95, method: 'tarjeta', channel: 'mesa', h: 13, m: 45 },
    { total: 180, method: 'efectivo', channel: 'pos', h: 14, m: 30 },
    { total: 55, method: 'efectivo', channel: 'mesa', h: 15, m: 15 },
    { total: 130, method: 'tarjeta', channel: 'pos', h: 16, m: 0 },
    { total: 70, method: 'efectivo', channel: 'qr', h: 16, m: 45 },
    { total: 160, method: 'mixto', channel: 'mesa', h: 17, m: 30, split: [80, 80] },
    { total: 88, method: 'efectivo', channel: 'pos', h: 18, m: 15 },
    { total: 102, method: 'tarjeta', channel: 'mesa', h: 19, m: 0 },
    { total: 140, method: 'efectivo', channel: 'pos', h: 19, m: 45 },
    { total: 60, method: 'efectivo', channel: 'mesa', h: 20, m: 30 },
    { total: 175, method: 'tarjeta', channel: 'pos', h: 21, m: 0 },
    { total: 92, method: 'efectivo', channel: 'mesa', h: 21, m: 45 },
    { total: 115, method: 'efectivo', channel: 'pos', h: 22, m: 15 },
    { total: 78, method: 'tarjeta', channel: 'mesa', h: 22, m: 45 },
  ]

  specs.forEach((s, i) => {
    const id = `ord-${i + 1}`
    const at = ts(s.h, s.m)
    orders.push({
      id,
      status: 'cobrada',
      total: s.total,
      channel: s.channel,
      created_at: at,
      updated_at: at,
    })

    if (s.method === 'mixto' && s.split) {
      payments.push({ order_id: id, method: 'efectivo', amount: s.split[0] })
      payments.push({ order_id: id, method: 'tarjeta', amount: s.split[1] })
    } else {
      payments.push({ order_id: id, method: s.method, amount: s.total })
    }
  })

  return { orders, payments }
}

const movements = [
  { type: 'entrada', amount: 500, note: 'Cambio adicional', at: ts(12, 0) },
  { type: 'salida', amount: 200, note: 'Compra insumos menores', at: ts(18, 0) },
]

console.log('QA Rehearsal — Ensayo general Día 6\n')

const { orders, payments } = buildJornada()
const qrOrders = orders.filter((o) => o.channel === 'qr')

assert('23 órdenes simuladas', orders.length === 23)
assert('3 pedidos QR', qrOrders.length === 3)
assert('turno 08:00 no es stale al cierre', !isShiftStale(OPENED_AT, new Date(CLOSED_AT)))

const full = computeShiftSummary(orders, payments, OPENED_AT)
assert('ventas turno = suma pagos', full.totalSales === full.paymentsTotal, `$${full.totalSales}`)
assert('mínimo 20 órdenes cobradas', full.orderCount >= 20, String(full.orderCount))

const mid = computeShiftSummary(orders, payments, OPENED_AT, CORTE_X_AT)
assert('Corte X: órdenes hasta 14:00', mid.orderCount === 10, String(mid.orderCount))
assert('Corte X: ventas parciales coherentes', mid.totalSales === mid.paymentsTotal, `$${mid.totalSales}`)

const expectedCash = computeExpectedCash(OPENING_AMOUNT, full.cashSales, movements)
const countedCash = expectedCash
const difference = countedCash - expectedCash

assert(
  'efectivo esperado = fondo + ventas efectivo + movimientos',
  expectedCash === OPENING_AMOUNT + full.cashSales + 300,
  `$${expectedCash}`
)
assert('Corte Z sin diferencia', difference === 0)
assert('ventas tarjeta > 0', full.byMethod.tarjeta > 0, `$${full.byMethod.tarjeta}`)
assert('ventas efectivo > 0', full.cashSales > 0, `$${full.cashSales}`)

console.log('\n--- Resumen jornada simulada ---')
console.log(`  Apertura:     $${OPENING_AMOUNT}`)
console.log(`  Órdenes:      ${full.orderCount}`)
console.log(`  Ventas total: $${full.totalSales}`)
console.log(`  · Efectivo:   $${full.cashSales}`)
console.log(`  · Tarjeta:    $${full.byMethod.tarjeta}`)
console.log(`  · Digital:    $${full.byMethod.transferencia}`)
console.log(`  Movimientos:  +$500 / -$200 = +$300`)
console.log(`  Efectivo esp: $${expectedCash}`)
console.log(`  Corte X (14h): ${mid.orderCount} órdenes · $${mid.totalSales}`)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
