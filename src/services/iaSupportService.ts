import {
  IA_RESTAURANT_KNOWLEDGE,
  AREA_LABELS,
  type KnowledgeArea,
  type KnowledgeChunk,
} from '@/data/iaRestaurantKnowledge'
import type { DashboardStats } from '@/types'
import type { UserRole } from '@/types'

export interface IAAnswer {
  text: string
  area: KnowledgeArea | 'live' | 'general'
  paths: string[]
  confidence: number
}

function normalize(q: string): string {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function scoreChunk(query: string, chunk: KnowledgeChunk): number {
  const q = normalize(query)
  let score = 0
  for (const kw of chunk.keywords) {
    const k = normalize(kw)
    if (q.includes(k)) score += 3
    else if (k.split(' ').every((w) => w.length > 2 && q.includes(w))) score += 1
  }
  const title = normalize(chunk.title)
  if (q.includes(title) || title.split(' ').some((w) => w.length > 3 && q.includes(w))) score += 2
  return score
}

function liveOpsAnswer(stats: DashboardStats | null | undefined): string | null {
  if (!stats) return null
  return (
    `Operación en vivo: ventas hoy ${stats.today_sales.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}, ` +
    `${stats.today_orders} órdenes, mesas activas ${stats.active_tables}/${stats.total_tables}, ` +
    `ticket promedio ${stats.avg_ticket.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}, ` +
    `órdenes pendientes ${stats.pending_orders}.`
  )
}

const ROLE_HINT: Partial<Record<UserRole, string>> = {
  admin_restaurant:
    'Como admin puedes revisar dashboard, seguridad, ajustes y suscripciones sin abrir turno de caja.',
  gerente: 'Como gerente: abre turno si vas a cobrar; usa reportes, inventario y equipo.',
  cajero: 'Como cajero: abre turno → POS → cobros → Corte X/Z al cerrar.',
  mesero: 'Como mesero: Mesas & Piso o /mesero; no necesitas turno de caja.',
  cocina: 'Como cocina: KDS en /app/kitchen; marca listo; no necesitas turno.',
  supervisor: 'Como supervisor: turno obligatorio si operas caja; también piso y cocina.',
}

export const iaSupportService = {
  listAreas(): { area: KnowledgeArea; label: string }[] {
    return (Object.keys(AREA_LABELS) as KnowledgeArea[]).map((area) => ({
      area,
      label: AREA_LABELS[area],
    }))
  },

  getChunksByArea(area: KnowledgeArea): KnowledgeChunk[] {
    return IA_RESTAURANT_KNOWLEDGE.filter((c) => c.area === area)
  },

  answer(
    question: string,
    opts?: { role?: UserRole; stats?: DashboardStats | null },
  ): IAAnswer {
    const q = question.trim()
    if (!q) {
      return {
        text: 'Pregúntame cómo funciona IA·RESTAURANT: turnos, POS, mesas, cocina, QR, impresoras, planes…',
        area: 'general',
        paths: ['/app/ia'],
        confidence: 0,
      }
    }

    const nq = normalize(q)
    const wantsLive =
      nq.includes('hoy') ||
      nq.includes('ventas') ||
      nq.includes('en vivo') ||
      nq.includes('ahora') ||
      nq.includes('cuanto') ||
      nq.includes('cuánto')

    if (wantsLive) {
      const live = liveOpsAnswer(opts?.stats)
      if (live) {
        return {
          text: live + (opts?.role && ROLE_HINT[opts.role] ? `\n\n${ROLE_HINT[opts.role]}` : ''),
          area: 'live',
          paths: ['/app/dashboard', '/app/reports'],
          confidence: 0.9,
        }
      }
    }

    const ranked = IA_RESTAURANT_KNOWLEDGE
      .map((chunk) => ({ chunk, score: scoreChunk(q, chunk) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)

    if (ranked.length === 0) {
      const areas = iaSupportService.listAreas().map((a) => a.label).join(', ')
      return {
        text:
          `No encontré un tema exacto. Puedo explicarte: ${areas}. ` +
          'Ejemplos: «¿Cómo abro turno?», «¿Cómo funciona el QR?», «¿Cómo cobro en POS?»',
        area: 'general',
        paths: ['/app/ia', '/app/modules'],
        confidence: 0.2,
      }
    }

    const top = ranked[0]
    const extras = ranked.slice(1, 3).filter((r) => r.score >= top.score - 1)
    let text = `**${top.chunk.title}**\n\n${top.chunk.content}`
    if (extras.length) {
      text += '\n\nTambién relacionado:\n' + extras.map((e) => `· ${e.chunk.title}`).join('\n')
    }
    if (opts?.role && ROLE_HINT[opts.role]) {
      text += `\n\n_${ROLE_HINT[opts.role]}_`
    }

    const paths = [
      ...new Set([
        ...(top.chunk.paths || []),
        ...extras.flatMap((e) => e.chunk.paths || []),
      ]),
    ]

    return {
      text,
      area: top.chunk.area,
      paths,
      confidence: Math.min(1, top.score / 6),
    }
  },
}
