import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, Send, Sparkles, BookOpen, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageBack } from '@/components/layout/PageBack'
import { useAuthStore } from '@/store/authStore'
import { useLiveOps } from '@/hooks/useLiveOps'
import { iaSupportService } from '@/services/iaSupportService'
import { AREA_LABELS, type KnowledgeArea } from '@/data/iaRestaurantKnowledge'

type Msg = { role: 'user' | 'ai'; text: string; paths?: string[]; area?: string }

const SUGGESTIONS = [
  '¿Qué es IA·RESTAURANT?',
  '¿Cómo abro un turno?',
  '¿Cómo cobro en el POS?',
  '¿Cómo funciona el menú QR?',
  '¿Cómo configuro impresoras?',
  '¿Cuánto vendimos hoy?',
]

export default function IASupportPage() {
  const { user } = useAuthStore()
  const { stats } = useLiveOps()
  const areas = useMemo(() => iaSupportService.listAreas(), [])
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'ai',
      text:
        `Hola ${user?.full_name || ''}. Soy IA-Support de IA·RESTAURANT. ` +
        'Conozco el sistema de 0 a 100%: turnos, POS, mesas, cocina, QR, impresoras, planes y seguridad. ¿Qué quieres aprender o revisar?',
      paths: ['/app/modules'],
      area: 'intro',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const ask = (question: string) => {
    const q = question.trim()
    if (!q || loading) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    window.setTimeout(() => {
      const answer = iaSupportService.answer(q, {
        role: user?.role,
        stats,
      })
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text: answer.text,
          paths: answer.paths,
          area: answer.area,
        },
      ])
      setLoading(false)
    }, 280)
  }

  const exploreArea = (area: KnowledgeArea) => {
    const chunks = iaSupportService.getChunksByArea(area)
    const first = chunks[0]
    if (first) ask(first.title)
  }

  return (
    <div className="space-y-6 animate-fadeUp max-w-6xl">
      <PageBack to="/app/dashboard" label="Centro de mando" />
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Brain size={20} className="text-ai-600" />
          <Badge variant="ai">IA-Support · conocimiento interno</Badge>
        </div>
        <h1 className="text-2xl font-black text-slate-800">Asistente IA·RESTAURANT</h1>
        <p className="text-sm text-slate-500 mt-1">
          Guía operativa completa + datos en vivo. Enseña cómo opera el sistema a tu equipo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 flex flex-col h-[560px]">
          <div className="p-4 border-b border-command-border flex items-center gap-2 bg-gradient-to-r from-brand-50 to-orange-50">
            <Sparkles size={16} className="text-ai-600" />
            <p className="font-bold text-slate-800">Chat de operación</p>
            <Badge variant="success" className="ml-auto text-[10px]">
              {user?.role?.replace('_', ' ') || 'usuario'}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-brand-500 text-white' : 'bg-command-elevated text-slate-800'
                  }`}
                >
                  {m.text.replace(/\*\*/g, '').replace(/_/g, '')}
                  {m.area && m.role === 'ai' && (
                    <p className="text-[10px] mt-2 opacity-70 uppercase tracking-wider">
                      {AREA_LABELS[m.area as KnowledgeArea] || m.area}
                    </p>
                  )}
                  {!!m.paths?.length && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {m.paths.map((path) => (
                        <Link
                          key={path}
                          to={path}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-white/80 border border-brand-200 rounded-lg px-2 py-1"
                        >
                          Ir {path} <ArrowRight size={10} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-slate-400 animate-pulse">IA-Support pensando…</p>}
          </div>
          <div className="p-4 border-t border-command-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask(input)}
              placeholder="Ej. ¿Cómo cierro el turno con Corte Z?"
              className="flex-1 rounded-xl border border-command-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <Button onClick={() => ask(input)} disabled={loading || !input.trim()}>
              <Send size={16} />
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-[10px] font-mono text-slate-500 uppercase mb-3 flex items-center gap-1">
              <BookOpen size={12} /> Temas (0–100%)
            </p>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <button
                  key={a.area}
                  type="button"
                  onClick={() => exploreArea(a.area)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg border border-command-border hover:border-brand-300 hover:bg-brand-50 font-semibold text-slate-700"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">Sugerencias</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="w-full text-left text-xs p-3 rounded-xl border border-command-border hover:border-brand-300 hover:bg-brand-50 transition-all"
                >
                  <Sparkles size={10} className="inline mr-1 text-brand-500" />
                  {s}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
