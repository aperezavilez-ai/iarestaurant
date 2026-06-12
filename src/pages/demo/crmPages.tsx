import { ModuleLayout } from '@/components/demo/ModuleLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { DEMO_CUSTOMERS, DEMO_INVOICES } from '@/data/demoSeed'
import { Plus } from 'lucide-react'

export function CustomersPage() {
  return (
    <ModuleLayout phase={5} title="Clientes y CRM" description="Historial, segmentación, campañas y perfil 360° del cliente."
      stats={[
        { label: 'Clientes', value: String(DEMO_CUSTOMERS.length) },
        { label: 'VIP', value: String(DEMO_CUSTOMERS.filter(c => c.segment === 'vip').length), color: 'text-brand-600' },
      ]}
      actions={<Button size="sm"><Plus size={14} /> Nuevo cliente</Button>}>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            {['Cliente', 'Visitas', 'Puntos', 'Gasto total', 'Segmento'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {DEMO_CUSTOMERS.map(c => (
              <tr key={c.id} className="hover:bg-brand-50/30">
                <td className="px-4 py-3">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone}</p>
                </td>
                <td className="px-4 py-3">{c.visits}</td>
                <td className="px-4 py-3 font-mono text-brand-600">{c.points}</td>
                <td className="px-4 py-3 font-mono">{formatCurrency(c.total_spent)}</td>
                <td className="px-4 py-3"><Badge variant={c.segment === 'vip' ? 'amber' : c.segment === 'frecuente' ? 'success' : 'info'} className="uppercase">{c.segment}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </ModuleLayout>
  )
}

export function LoyaltyPage() {
  const rules = [
    { name: '1 punto por cada $10', active: true },
    { name: '100 puntos = $50 descuento', active: true },
    { name: 'Doble puntos martes', active: true },
    { name: 'Cumpleaños: postre gratis', active: true },
  ]
  return (
    <ModuleLayout phase={5} title="Programa de lealtad" description="Puntos, cupones, recompensas y fidelización desde QR.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">Reglas activas</p>
          {rules.map(r => (
            <div key={r.name} className="flex justify-between py-2 border-b border-command-border last:border-0">
              <span className="text-sm">{r.name}</span>
              <Badge variant="success">Activa</Badge>
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">Top clientes</p>
          {DEMO_CUSTOMERS.sort((a, b) => b.points - a.points).slice(0, 4).map(c => (
            <div key={c.id} className="flex justify-between py-2 border-b border-command-border last:border-0">
              <span className="text-sm font-semibold">{c.name}</span>
              <span className="font-mono text-brand-600">{c.points} pts</span>
            </div>
          ))}
        </Card>
      </div>
    </ModuleLayout>
  )
}

export function InvoicingPage() {
  return (
    <ModuleLayout phase={6} title="Facturación CFDI 4.0" description="Timbrado, cancelaciones, XML, PDF — preparado para integración PAC."
      stats={[
        { label: 'Timbradas', value: String(DEMO_INVOICES.filter(i => i.status === 'timbrada').length) },
        { label: 'Pendientes', value: String(DEMO_INVOICES.filter(i => i.status === 'pendiente').length) },
      ]}>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            {['Folio', 'Orden', 'RFC', 'Total', 'Estado', 'Fecha'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {DEMO_INVOICES.map(i => (
              <tr key={i.id}>
                <td className="px-4 py-3 font-mono text-brand-600">{i.folio}</td>
                <td className="px-4 py-3">{i.order_folio}</td>
                <td className="px-4 py-3 font-mono text-xs">{i.rfc}</td>
                <td className="px-4 py-3 font-bold">{formatCurrency(i.total)}</td>
                <td className="px-4 py-3"><Badge variant={i.status === 'timbrada' ? 'success' : i.status === 'cancelada' ? 'danger' : 'warning'} className="capitalize">{i.status}</Badge></td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(i.created_at).toLocaleDateString('es-MX')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </ModuleLayout>
  )
}

export function FinancePage() {
  const items = [
    { label: 'Cuentas por cobrar', value: 18400, color: 'text-green-600' },
    { label: 'Cuentas por pagar', value: 9400, color: 'text-red-600' },
    { label: 'Flujo de efectivo (mes)', value: 48200, color: 'text-brand-600' },
    { label: 'Rentabilidad sucursal', value: 34, suffix: '%' },
  ]
  return (
    <ModuleLayout phase={31} title="Gestión financiera" description="CxC, CxP, flujo de efectivo, presupuestos y rentabilidad por sucursal.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(i => (
          <Card key={i.label} className="p-5 text-center">
            <p className="text-[10px] font-mono text-slate-500 uppercase">{i.label}</p>
            <p className={`text-2xl font-black font-mono mt-2 ${i.color}`}>
              {i.suffix ? `${i.value}${i.suffix}` : formatCurrency(i.value)}
            </p>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}
