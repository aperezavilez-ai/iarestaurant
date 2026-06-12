import { useEffect, useState } from 'react'
import { TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { financeRepository } from '@/repositories/financeRepository'
import { useTenantContext } from '@/hooks/useTenantContext'

export default function FinancePage() {
  const ctx = useTenantContext()
  const [snap, setSnap] = useState({
    accountsReceivable: 0, accountsPayable: 0, cashFlowMonth: 0, margin: 0,
    inventoryValue: 0, pendingInvoices: 0, pendingPurchases: 0,
  })

  useEffect(() => {
    if (!ctx) return
    financeRepository.getSnapshot(ctx).then(setSnap)
  }, [ctx])

  const payables = financeRepository.getPayables()
  const receivables = financeRepository.getReceivables()

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Fase 25</p>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <TrendingUp size={24} /> Gestión financiera
        </h1>
        <p className="text-sm text-slate-500">CxC, CxP, flujo de efectivo e inventario valorizado</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CxC (facturas pend.)', value: formatCurrency(snap.accountsReceivable), color: 'text-ops-success', icon: ArrowUpCircle },
          { label: 'CxP (compras pend.)', value: formatCurrency(snap.accountsPayable), color: 'text-ops-danger', icon: ArrowDownCircle },
          { label: 'Flujo mes', value: formatCurrency(snap.cashFlowMonth), color: 'text-brand-600', icon: TrendingUp },
          { label: 'Margen bruto est.', value: `${snap.margin}%`, color: 'text-slate-800', icon: TrendingUp },
        ].map(i => (
          <Card key={i.label} className="p-5">
            <i.icon size={18} className="text-slate-400 mb-2" />
            <p className="text-[10px] font-mono text-slate-500 uppercase">{i.label}</p>
            <p className={`text-2xl font-black font-mono mt-2 ${i.color}`}>{i.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b bg-brand-50/50 flex justify-between">
            <p className="font-bold text-slate-800">Cuentas por cobrar</p>
            <Badge>{receivables.length}</Badge>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {receivables.length === 0 ? (
                <tr><td className="px-4 py-6 text-center text-slate-500">Sin facturas pendientes</td></tr>
              ) : receivables.map(i => (
                <tr key={i.id}>
                  <td className="px-4 py-3 font-mono text-brand-600">{i.folio}</td>
                  <td className="px-4 py-3">{i.razon_social || i.rfc}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b bg-brand-50/50 flex justify-between">
            <p className="font-bold text-slate-800">Cuentas por pagar</p>
            <Badge variant="warning">{payables.length}</Badge>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {payables.length === 0 ? (
                <tr><td className="px-4 py-6 text-center text-slate-500">Sin órdenes de compra pendientes</td></tr>
              ) : payables.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-semibold">{p.supplier_name}</td>
                  <td className="px-4 py-3"><Badge variant="warning" className="capitalize">{p.status}</Badge></td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="p-4">
        <p className="text-sm text-slate-600">Valor de inventario actual: <strong className="text-brand-700">{formatCurrency(snap.inventoryValue)}</strong></p>
      </Card>
    </div>
  )
}
