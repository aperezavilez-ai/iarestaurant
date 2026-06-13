import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import { inventoryRepository } from '@/repositories/inventoryRepository'
import { useTenantContext } from '@/hooks/useTenantContext'
import { toast } from '@/components/ui/Toast'

export default function InventoryPage() {
  const ctx = useTenantContext()
  const [tick, setTick] = useState(0)
  const [loading, setLoading] = useState(true)
  const ingredients = inventoryRepository.getIngredients()
  const movements = inventoryRepository.getMovements()
  const lowStock = inventoryRepository.getLowStock()
  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [delta, setDelta] = useState('')

  useEffect(() => {
    if (!ctx) return
    setLoading(true)
    inventoryRepository.ensureLoaded(ctx).finally(() => {
      setLoading(false)
      setTick((t) => t + 1)
    })
  }, [ctx])

  const refresh = () => setTick((t) => t + 1)

  const handleAdjust = async () => {
    if (!ctx || !adjustId || !delta) return
    const ing = ingredients.find((i) => i.id === adjustId)
    await inventoryRepository.adjustStock(ctx, adjustId, Number(delta), 'Ajuste manual')
    toast(`Stock de ${ing?.name} actualizado`, 'success')
    setAdjustId(null)
    setDelta('')
    refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
        Cargando inventario…
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Fase 22</p>
        <h1 className="text-2xl font-black text-slate-800">Inventario y kardex</h1>
        <p className="text-sm text-slate-500">Descuento automático al vender · alertas de stock bajo</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center"><p className="text-2xl font-mono font-black">{ingredients.length}</p><p className="text-[10px] text-slate-500 uppercase">Ingredientes</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-mono font-black text-ops-danger">{lowStock.length}</p><p className="text-[10px] text-slate-500 uppercase">Stock bajo</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-mono font-black text-brand-600">{formatCurrency(inventoryRepository.getInventoryValue())}</p><p className="text-[10px] text-slate-500 uppercase">Valor</p></Card>
      </div>

      {lowStock.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm font-bold text-ops-danger flex items-center gap-2"><AlertTriangle size={16} /> Alertas de reabastecimiento</p>
          <p className="text-xs text-slate-600 mt-1">{lowStock.map((i) => i.name).join(', ')}</p>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            {['Ingrediente', 'Unidad', 'Existencia', 'Mínimo', 'Costo', 'Estado', ''].map((h) => (
              <th key={h || 'a'} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {ingredients.map((i) => (
              <tr key={i.id} className="hover:bg-brand-50/30">
                <td className="px-4 py-3 font-semibold">{i.name}</td>
                <td className="px-4 py-3 text-slate-500">{i.unit}</td>
                <td className="px-4 py-3 font-mono font-bold">{i.stock.toFixed(i.unit === 'kg' || i.unit === 'L' ? 2 : 0)}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{i.min_stock}</td>
                <td className="px-4 py-3">{formatCurrency(i.cost)}</td>
                <td className="px-4 py-3">
                  {i.stock <= i.min_stock
                    ? <Badge variant="danger" className="gap-1"><AlertTriangle size={10} /> Bajo</Badge>
                    : <Badge variant="success">OK</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => { setAdjustId(i.id); setDelta('5') }} className="p-1.5 rounded-lg bg-green-50 text-ops-success"><ArrowUp size={12} /></button>
                    <button onClick={() => { setAdjustId(i.id); setDelta('-2') }} className="p-1.5 rounded-lg bg-red-50 text-ops-danger"><ArrowDown size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {movements.length > 0 && (
        <Card className="p-4">
          <p className="font-bold text-slate-800 mb-3">Movimientos recientes (kardex)</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {movements.slice(0, 15).map((m) => (
              <div key={m.id} className="flex justify-between text-xs border-b border-command-border pb-2">
                <span className={m.delta < 0 ? 'text-ops-danger' : 'text-ops-success'}>
                  {m.delta > 0 ? '+' : ''}{m.delta} {m.ingredient_name}
                </span>
                <span className="text-slate-500">{m.reason}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={!!adjustId} onClose={() => setAdjustId(null)} title="Ajustar stock" size="sm">
        <div className="p-5 space-y-4">
          <Input label="Cantidad (+ entrar / − salir)" type="number" value={delta} onChange={(e) => setDelta(e.target.value)} />
          <Button className="w-full" onClick={handleAdjust}>Aplicar ajuste</Button>
        </div>
      </Modal>
    </div>
  )
}
