import { ModuleLayout } from '@/components/demo/ModuleLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { DEMO_INGREDIENTS, DEMO_SUPPLIERS, DEMO_PURCHASES } from '@/data/demoSeed'
import { Plus, AlertTriangle } from 'lucide-react'

export function InventoryPage() {
  const lowStock = DEMO_INGREDIENTS.filter(i => i.stock <= i.min_stock)
  return (
    <ModuleLayout phase={4} title="Inventario y kardex" description="Ingredientes, unidades, recetas, descuento automático y alertas de stock."
      stats={[
        { label: 'Ingredientes', value: String(DEMO_INGREDIENTS.length) },
        { label: 'Stock bajo', value: String(lowStock.length), color: 'text-ops-danger' },
        { label: 'Valor inventario', value: formatCurrency(DEMO_INGREDIENTS.reduce((s, i) => s + i.stock * i.cost, 0)) },
      ]}
      actions={<Button size="sm"><Plus size={14} /> Nuevo ingrediente</Button>}>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            {['Ingrediente', 'Unidad', 'Existencia', 'Mínimo', 'Costo', 'Estado'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {DEMO_INGREDIENTS.map(i => (
              <tr key={i.id} className="hover:bg-brand-50/30">
                <td className="px-4 py-3 font-semibold">{i.name}</td>
                <td className="px-4 py-3 text-slate-500">{i.unit}</td>
                <td className="px-4 py-3 font-mono">{i.stock}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{i.min_stock}</td>
                <td className="px-4 py-3">{formatCurrency(i.cost)}</td>
                <td className="px-4 py-3">
                  {i.stock <= i.min_stock
                    ? <Badge variant="danger" className="gap-1"><AlertTriangle size={10} /> Bajo</Badge>
                    : <Badge variant="success">OK</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </ModuleLayout>
  )
}

export function SuppliersPage() {
  return (
    <ModuleLayout phase={4} title="Proveedores" description="Directorio de proveedores con historial y contactos."
      actions={<Button size="sm"><Plus size={14} /> Nuevo proveedor</Button>}>
      <div className="grid gap-3">
        {DEMO_SUPPLIERS.map(s => (
          <Card key={s.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">{s.name}</p>
              <p className="text-xs text-slate-500">{s.contact} · {s.phone} · {s.email}</p>
            </div>
            <Badge variant="success">Activo</Badge>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function PurchasesPage() {
  return (
    <ModuleLayout phase={23} title="Compras y cuentas por pagar" description="Órdenes de compra, recepciones, devoluciones y calendario de pagos."
      stats={[{ label: 'Pendientes', value: String(DEMO_PURCHASES.filter(p => p.status === 'pendiente').length) }]}>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            {['Proveedor', 'Total', 'Estado', 'Fecha'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {DEMO_PURCHASES.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-semibold">{p.supplier_name}</td>
                <td className="px-4 py-3 font-mono">{formatCurrency(p.total)}</td>
                <td className="px-4 py-3"><Badge variant={p.status === 'recibida' ? 'success' : p.status === 'pendiente' ? 'warning' : 'info'} className="capitalize">{p.status}</Badge></td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(p.created_at).toLocaleDateString('es-MX')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </ModuleLayout>
  )
}
