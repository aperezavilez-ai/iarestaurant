import { useState } from 'react'
import { Package, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { purchaseRepository } from '@/repositories/purchaseRepository'
import { toast } from '@/components/ui/Toast'

export default function PurchasesPage() {
  const [, setTick] = useState(0)
  const purchases = purchaseRepository.getPurchases()
  const suppliers = purchaseRepository.getSuppliers()
  const refresh = () => setTick(t => t + 1)

  const handleReceive = async (id: string) => {
    await purchaseRepository.receiveOrder(id)
    toast('Mercancía recibida — inventario actualizado', 'success')
    refresh()
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Fase 24</p>
        <h1 className="text-2xl font-black text-slate-800">Compras y cuentas por pagar</h1>
        <p className="text-sm text-slate-500">{suppliers.length} proveedores · {purchases.filter(p => p.status === 'pendiente').length} órdenes pendientes</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            {['Proveedor', 'Total', 'Estado', 'Fecha', 'Acciones'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {purchases.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-semibold">{p.supplier_name}</td>
                <td className="px-4 py-3 font-mono">{formatCurrency(p.total)}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === 'recibida' ? 'success' : p.status === 'pendiente' ? 'warning' : 'info'} className="capitalize">{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(p.created_at).toLocaleDateString('es-MX')}</td>
                <td className="px-4 py-3">
                  {(p.status === 'pendiente' || p.status === 'parcial') && (
                    <Button size="sm" variant="outline" onClick={() => handleReceive(p.id)}>
                      <Package size={12} /> Recibir
                    </Button>
                  )}
                  {p.status === 'recibida' && <CheckCircle size={16} className="text-ops-success" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
