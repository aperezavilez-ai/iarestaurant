/**
 * Smoke tests para lógica de turno de caja (Día 2 go-live).
 * Ejecutar: npm run qa:smoke
 */
import { isShiftStale, computeShiftSummary } from './lib/cashShiftLogic.mjs'

const now = new Date('2026-06-16T14:00:00')
const yesterday = '2026-06-15T22:00:00'
const todayMorning = '2026-06-16T08:00:00'

let passed = 0
let failed = 0

function assert(name, cond) {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.error(`  ✗ ${name}`)
  }
}

console.log('QA Smoke — Turno de caja\n')

assert('turno de ayer es stale', isShiftStale(yesterday, now))
assert('turno de hoy no es stale', !isShiftStale(todayMorning, now))

const orders = [
  { id: 'o1', status: 'cobrada', total: 100, updated_at: '2026-06-16T10:00:00' },
  { id: 'o2', status: 'cobrada', total: 50, updated_at: '2026-06-15T20:00:00' },
  { id: 'o3', status: 'abierta', total: 30, updated_at: '2026-06-16T11:00:00' },
]
const payments = [
  { order_id: 'o1', method: 'efectivo', amount: 100 },
  { order_id: 'o2', method: 'efectivo', amount: 50 },
]
const summary = computeShiftSummary(orders, payments, todayMorning)
assert('ventas turno = 100', summary.totalSales === 100)
assert('ordenes turno = 1', summary.orderCount === 1)
assert('efectivo turno = 100', summary.cashSales === 100)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
