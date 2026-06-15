import { ExternalLink, BookOpen, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { PaymentGatewayDef } from '@/data/paymentGateways'

interface PaymentGatewayCardProps {
  gateway: PaymentGatewayDef
  selected: boolean
  onSelect: () => void
}

export function PaymentGatewayCard({ gateway, selected, onSelect }: PaymentGatewayCardProps) {
  return (
    <Card
      className={cn(
        'p-5 flex flex-col h-full transition-all border-2',
        selected ? 'border-brand-400 bg-brand-50/40 shadow-glow' : 'border-command-border hover:border-brand-200',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0"
          style={{ backgroundColor: gateway.accent }}
        >
          {gateway.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-slate-800">{gateway.name}</h3>
            {selected && <Badge variant="success">Tu pasarela</Badge>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{gateway.tagline} · {gateway.region}</p>
        </div>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed flex-1">{gateway.description}</p>

      <ul className="mt-4 grid grid-cols-2 gap-1.5">
        {gateway.features.map((f) => (
          <li key={f} className="text-[11px] text-slate-600 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-brand-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[10px] text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-100 leading-snug">
        {gateway.accountNote}
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <a href={gateway.signupUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button variant="secondary" className="w-full" type="button">
            <ExternalLink size={14} /> Crear cuenta
          </Button>
        </a>
        <a href={gateway.docsUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button variant="outline" className="w-full" type="button">
            <BookOpen size={14} /> Documentación
          </Button>
        </a>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'mt-3 w-full py-2.5 rounded-xl text-xs font-bold border transition-all',
          selected
            ? 'bg-brand-100 border-brand-400 text-brand-800'
            : 'border-command-border text-slate-600 hover:bg-brand-50 hover:border-brand-300',
        )}
      >
        {selected ? '✓ Pasarela principal para cobros' : 'Usar como mi pasarela principal'}
      </button>
    </Card>
  )
}
