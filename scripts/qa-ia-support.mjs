/**
 * QA IA-Support — cables + conocimiento + política de turnos admin.
 * Uso: npm run qa:ia-support
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
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

function read(rel) {
  const p = resolve(root, rel)
  assert(`existe ${rel}`, existsSync(p))
  return existsSync(p) ? readFileSync(p, 'utf8') : ''
}

console.log('QA IA-Support — cables rotos + conocimiento\n')

const knowledge = read('src/data/iaRestaurantKnowledge.ts')
const service = read('src/services/iaSupportService.ts')
const page = read('src/pages/IASupportPage.tsx')
const app = read('src/App.tsx')
const modules = read('src/config/modules.ts')
const cash = read('src/config/cashShift.ts')
const shell = read('src/components/layout/CommandShell.tsx')
const copilot = read('src/components/ai/AICopilot.tsx')

const areas = [
  'intro', 'login', 'turno', 'pos', 'mesas', 'cocina', 'caja', 'catalogo',
  'qr', 'impresoras', 'correo', 'suscripciones', 'seguridad', 'roles', 'ia', 'contingencia',
]
for (const area of areas) {
  assert(`conocimiento área ${area}`, knowledge.includes(`area: '${area}'`))
}

assert('servicio answer()', service.includes('answer(') && service.includes('iaSupportService'))
assert('servicio live ops', service.includes("area: 'live'") || service.includes('liveOpsAnswer'))
assert('hint admin sin turno', service.includes('admin_restaurant') && service.includes('sin abrir turno'))
assert('página usa servicio', page.includes('iaSupportService.answer'))
assert('ruta /app/ia', app.includes('path="ia"') && app.includes('IASupportPage'))
assert('módulo ia-chat en producción', modules.includes("'ia-chat'"))
assert('meta CommandShell /app/ia', shell.includes("'/app/ia'"))
assert('admin NO requiere turno', !/SHIFT_REQUIRED_ROLES[\s\S]*'admin_restaurant'/.test(cash))
assert('cajero sí requiere turno', cash.includes("'cajero'"))
assert('gerente sí requiere turno', cash.includes("'gerente'"))
assert('copiloto existe', copilot.includes('AICopilot'))

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
