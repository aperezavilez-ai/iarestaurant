/**
 * Suite go-live Día 7 — ejecuta todos los QA + build.
 * Uso: npm run qa:golive
 */
import { spawnSync } from 'node:child_process'

const steps = [
  { name: 'qa:smoke', cmd: 'npm', args: ['run', 'qa:smoke'] },
    { name: 'qa:split', cmd: 'npm', args: ['run', 'qa:split'] },
    { name: 'qa:rehearsal', cmd: 'npm', args: ['run', 'qa:rehearsal'] },
  { name: 'qa:health', cmd: 'npm', args: ['run', 'qa:health'] },
  { name: 'build', cmd: 'npm', args: ['run', 'build'] },
]

let failed = 0

console.log('QA Go-Live — Día 7\n')

for (const step of steps) {
  console.log(`\n${'='.repeat(48)}\n  ${step.name}\n${'='.repeat(48)}\n`)
  const result = spawnSync(step.cmd, step.args, { stdio: 'inherit', shell: true })
  if (result.status !== 0) {
    failed++
    console.error(`\n✗ ${step.name} falló (exit ${result.status ?? 1})`)
  }
}

console.log(`\n${'='.repeat(48)}`)
if (failed === 0) {
  console.log('✓ Go-live QA completo — listo para producción')
  process.exit(0)
} else {
  console.error(`✗ ${failed} paso(s) fallaron`)
  process.exit(1)
}
