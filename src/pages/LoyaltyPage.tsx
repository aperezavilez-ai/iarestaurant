import { Gift } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { crmRepository } from '@/repositories/crmRepository'

export default function LoyaltyPage() {
  const rules = crmRepository.getLoyaltyRules()
  const top = [...crmRepository.getCustomers()].sort((a, b) => b.points - a.points).slice(0, 6)

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Fase 32</p>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Gift size={24} /> Programa de lealtad</h1>
        <p className="text-sm text-slate-500">Puntos automáticos al registrar ventas en CRM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">Reglas activas</p>
          {rules.map(r => (
            <div key={r.id} className="flex justify-between py-2 border-b border-command-border last:border-0">
              <span className="text-sm">{r.name}</span>
              <Badge variant={r.active ? 'success' : 'default'}>{r.active ? 'Activa' : 'Off'}</Badge>
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">Top clientes</p>
          {top.map(c => (
            <div key={c.id} className="flex justify-between py-2 border-b border-command-border last:border-0">
              <div>
                <span className="text-sm font-semibold">{c.name}</span>
                <p className="text-[10px] text-slate-500">{c.visits} visitas · {formatCurrency(c.total_spent)}</p>
              </div>
              <span className="font-mono text-brand-600 font-bold">{c.points} pts</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
