import { charsPerLine } from '@/data/printerBrands'
import type { PaperWidth, TicketPrintJob } from '@/types/printer'

const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

function padLine(left: string, right: string, width: number): string {
  const gap = width - left.length - right.length
  if (gap < 1) return `${left.slice(0, width - right.length - 1)} ${right}`
  return left + ' '.repeat(gap) + right
}

function center(text: string, width: number): string {
  const t = text.slice(0, width)
  const pad = Math.max(0, Math.floor((width - t.length) / 2))
  return ' '.repeat(pad) + t
}

function separator(width: number): string {
  return '-'.repeat(width)
}

export function buildEscPosTicket(job: TicketPrintJob, paperWidth: PaperWidth = 80): Uint8Array {
  const w = charsPerLine(paperWidth)
  const chunks: number[] = []

  const push = (...bytes: number[]) => chunks.push(...bytes)
  const line = (text = '') => {
    push(...encodeText(text.slice(0, w) + '\n'))
  }

  // Init
  push(ESC, 0x40)
  // Center align
  push(ESC, 0x61, 1)

  if (job.title) {
    push(ESC, 0x45, 1) // bold on
    line(center(job.title, w))
    push(ESC, 0x45, 0)
  }

  push(ESC, 0x61, 0) // left align

  for (const raw of job.lines) {
    if (raw === '---') {
      line(separator(w))
      continue
    }
    if (raw.startsWith('>>')) {
      push(ESC, 0x45, 1)
      line(raw.slice(2).trim())
      push(ESC, 0x45, 0)
      continue
    }
    if (raw.includes('|')) {
      const [l, r] = raw.split('|')
      line(padLine(l.trim(), r.trim(), w))
      continue
    }
    line(raw)
  }

  line('')
  push(ESC, 0x61, 1)
  line('IA·RESTAURANT')
  push(ESC, 0x61, 0)

  if (job.cut !== false) {
    push(GS, 0x56, 0) // full cut
  }

  push(LF, LF)
  return new Uint8Array(chunks)
}

export function buildTestTicket(paperWidth: PaperWidth = 80): Uint8Array {
  return buildEscPosTicket(
    {
      title: 'PRUEBA IA·RESTAURANT',
      lines: [
        new Date().toLocaleString('es-MX'),
        '---',
        'Impresora conectada OK',
        'ESC/POS · ticket térmico',
        '---',
        'Gracias',
      ],
    },
    paperWidth,
  )
}
