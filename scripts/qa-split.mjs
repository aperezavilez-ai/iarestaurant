/**
 * QA división de cuenta — partes iguales, por ítems y cuadre en turno.
 * Uso: npm run qa:split
 */
import {
  buildEqualSplitParts,
  buildItemSplitParts,
  splitPartsTotal,
} from './lib/splitBillLogic.mjs'
import { computeShiftSummary } from './lib/cashShiftLogic.mjs'

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

console.log('QA Split Bill — división de cuenta\n')

// Partes iguales — centavos al último
const equal = buildEqualSplitParts(100, ['María', 'José', 'Carlos'])
assert('3 partes iguales de $100', equal.length === 3)
assert('suma partes = total', splitPartsTotal(equal) === 100, `$${splitPartsTotal(equal)}`)

const odd = buildEqualSplitParts(10.01, ['A', 'B', 'C'])
assert('reparto con centavos', splitPartsTotal(odd) === 10.01)

// Por ítems — IVA proporcional
const order = {
  subtotal: 200,
  total: 232,
  items: [
    { id: 'i1', product_name: 'Tacos', subtotal: 120 },
    { id: 'i2', product_name: 'Agua', subtotal: 40 },
    { id: 'i3', product_name: 'Postre', subtotal: 40 },
  ],
}
const byItems = buildItemSplitParts(order, [
  { label: 'María', item_ids: ['i1'] },
  { label: 'José', item_ids: ['i2'] },
  { label: 'Carlos', item_ids: ['i3'] },
])
assert('split por ítems: 3 partes', byItems.length === 3)
assert('split por ítems: suma = total orden', splitPartsTotal(byItems) === 232, `$${splitPartsTotal(byItems)}`)
assert('María paga más (tacos)', byItems[0].amount > byItems[1].amount)

// Cuadre turno con pagos split (referencia split:partId)
const splitOrder = {
  id: 'ord-split',
  status: 'cobrada',
  total: 300,
  created_at: '2026-06-16T12:00:00',
  updated_at: '2026-06-16T12:30:00',
}
const splitPayments = [
  { order_id: 'ord-split', method: 'efectivo', amount: 100, reference: 'split:p1' },
  { order_id: 'ord-split', method: 'tarjeta', amount: 100, reference: 'split:p2' },
  { order_id: 'ord-split', method: 'efectivo', amount: 60, reference: 'split:p3:efectivo' },
  { order_id: 'ord-split', method: 'tarjeta', amount: 40, reference: 'split:p3:tarjeta' },
]
const summary = computeShiftSummary([splitOrder], splitPayments, '2026-06-16T08:00:00')
assert('split: ventas = pagos', summary.totalSales === summary.paymentsTotal, `$${summary.totalSales}`)
assert('split: efectivo $160', summary.cashSales === 160, `$${summary.cashSales}`)
assert('split: tarjeta $140', summary.byMethod.tarjeta === 140, `$${summary.byMethod.tarjeta}`)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
