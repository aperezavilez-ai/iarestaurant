import { useState } from 'react'
import { ModuleLayout } from '@/components/demo/ModuleLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Send, Sparkles, Brain } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const IA_RESPONSES: Record<string, string[]> = {
  gerente: [
    'Hoy llevas $4,820 en ventas con 12 órdenes. El ticket promedio es $401.',
    'El producto más vendido es Tacos de Pastor (18 uds). Te recomiendo promover bebidas en mesas con solo comida.',
    'Mesa 5 lleva 32 minutos ocupada — considera verificar si necesitan atención.',
  ],
  mesero: [
    'Tienes asignadas: Mesa 4 (ocupada), Mesa 5 (ocupada), Mesa 12 (pedido en preparación).',
    'Pedidos listos: Mesa 5 → Tacos de Pastor + Guacamole. Mesa 8 → Margarita + Cerveza.',
    'Promoción activa: 2x1 Tacos los martes de 14:00 a 20:00.',
  ],
  cocina: [
    'Receta Tacos de Pastor: tortilla, 80g carne al pastor, piña, cilantro, cebolla. Tiempo: 8 min.',
    '3 órdenes en cola. Prioridad: Mesa 5 (12 min) — platillos calientes primero.',
    'Alerta: Limón en stock bajo (2 kg). Afecta bebidas y cocteles.',
  ],
  cajero: [
    'Caja abierta desde las 08:00 con fondo $2,000. Ventas del turno: $4,820.',
    'Efectivo esperado: $6,820. 2 mesas pendientes de cobro.',
    '1 factura CFDI pendiente de timbrar (ORD-20260611-0005).',
  ],
  admin_restaurant: [
    'Sistema operativo. 127 restaurantes en plataforma SaaS. Tu plan: Profesional.',
    '3 alertas activas: stock bajo limón, mesa 5 esperando, 1 factura pendiente.',
    'IA-Support conectado a: ventas, inventario, mesas, cocina y CRM.',
  ],
}

export function IAChatPage() {
  const { user } = useAuthStore()
  const role = user?.role || 'gerente'
  const responses = IA_RESPONSES[role] || IA_RESPONSES.gerente
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: `Hola ${user?.full_name}, soy IA-Support. Pregúntame sobre tu operación en tiempo real.` },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = () => {
    if (!input.trim()) return
    const q = input.trim()
    setMessages(m => [...m, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    setTimeout(() => {
      const answer = responses[Math.floor(Math.random() * responses.length)]
      setMessages(m => [...m, { role: 'ai', text: answer }])
      setLoading(false)
    }, 800)
  }

  const suggestions = [
    '¿Cuánto vendimos hoy?',
    '¿Qué pedidos están listos?',
    '¿Qué productos están agotados?',
    '¿Qué debo comprar mañana?',
  ]

  return (
    <ModuleLayout phase={31} title="IA-Support" description="Asistente inteligente por rol con consultas en lenguaje natural y datos reales del negocio."
      stats={[{ label: 'Rol activo', value: role.replace('_', ' ') }, { label: 'Estado', value: 'En línea' }]}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 flex flex-col h-[480px]">
          <div className="p-4 border-b border-command-border flex items-center gap-2 bg-gradient-to-r from-brand-50 to-orange-50">
            <Brain size={18} className="text-ai-600" />
            <p className="font-bold text-slate-800">Copiloto IA — {role.replace('_', ' ')}</p>
            <Badge variant="ai" className="ml-auto">RAG Demo</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'bg-brand-500 text-white' : 'bg-command-elevated text-slate-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-slate-400 animate-pulse">IA-Support pensando...</p>}
          </div>
          <div className="p-4 border-t border-command-border flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Pregunta sobre tu operación..."
              className="flex-1 rounded-xl border border-command-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <Button onClick={send} disabled={loading}><Send size={16} /></Button>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">Sugerencias</p>
          <div className="space-y-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => setInput(s)}
                className="w-full text-left text-xs p-3 rounded-xl border border-command-border hover:border-brand-300 hover:bg-brand-50 transition-all">
                <Sparkles size={10} className="inline mr-1 text-brand-500" />{s}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-4">Demo: respuestas simuladas por rol. Con IA conectada usará datos reales.</p>
        </Card>
      </div>
    </ModuleLayout>
  )
}
