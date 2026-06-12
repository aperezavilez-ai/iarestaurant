import { useState } from 'react'
import { Plus, Truck, ChefHat, MapPin, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import { deliveryRepository, DELIVERY_DRIVERS } from '@/repositories/deliveryRepository'
import { useTenantContext } from '@/hooks/useTenantContext'
import { toast } from '@/components/ui/Toast'
import type { DeliveryOrder } from '@/types/demo'

const STATUS_VARIANT: Record<DeliveryOrder['status'], 'warning' | 'info' | 'amber' | 'success' | 'danger'> = {
  recibido: 'warning',
  preparando: 'info',
  en_camino: 'amber',
  entregado: 'success',
  cancelado: 'danger',
}

const STATUS_LABEL: Record<DeliveryOrder['status'], string> = {
  recibido: 'Recibido',
  preparando: 'Preparando',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export default function DeliveryPage() {
  const ctx = useTenantContext()
  const [, setTick] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ customer_name: '', phone: '', address: '', total: 350, notes: '' })

  const refresh = () => setTick(t => t + 1)
  const deliveries = deliveryRepository.getAll()
  const active = deliveryRepository.getActive()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await deliveryRepository.create({ ...form, total: Number(form.total) })
    toast('Pedido delivery creado', 'success')
    setCreateOpen(false)
    setForm({ customer_name: '', phone: '', address: '', total: 350, notes: '' })
    refresh()
  }

  const advance = async (id: string) => {
    const d = await deliveryRepository.advanceStatus(id)
    if (d) toast(`Estado: ${STATUS_LABEL[d.status]}`, 'info')
    refresh()
  }

  const sendKitchen = async (id: string) => {
    if (!ctx) return
    await deliveryRepository.sendToKitchen(ctx, id)
    toast('Enviado a cocina', 'success')
    refresh()
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Fase 33</p>
          <h1 className="text-2xl font-black text-slate-800">Delivery</h1>
          <p className="text-sm text-slate-500">Pedidos a domicilio, repartidores y seguimiento</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Nuevo pedido</Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(['recibido', 'preparando', 'en_camino', 'entregado'] as const).map(s => (
          <Card key={s} className="p-3 text-center">
            <p className="text-xl font-mono font-black">{deliveries.filter(d => d.status === s).length}</p>
            <p className="text-[10px] text-slate-500 uppercase">{STATUS_LABEL[s]}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3">
        {active.map(d => (
          <Card key={d.id} className="p-4">
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg text-slate-800">{d.customer_name}</p>
                  <Badge variant={STATUS_VARIANT[d.status]}>{STATUS_LABEL[d.status]}</Badge>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={12} />{d.address}</p>
                {d.phone && <p className="text-xs text-slate-500">{d.phone}</p>}
                {d.driver && <p className="text-xs text-brand-600 mt-1 flex items-center gap-1"><Truck size={12} />{d.driver}</p>}
              </div>
              <p className="text-xl font-mono font-black text-brand-600">{formatCurrency(d.total)}</p>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {d.status === 'recibido' && (
                <Button size="sm" variant="outline" onClick={() => sendKitchen(d.id)}>
                  <ChefHat size={14} /> Cocina
                </Button>
              )}
              {d.status === 'preparando' && !d.driver && (
                <select className="text-xs border border-command-border rounded-lg px-2 py-1.5"
                  onChange={e => { deliveryRepository.assignDriver(d.id, e.target.value); refresh() }}
                  defaultValue="">
                  <option value="" disabled>Asignar repartidor</option>
                  {DELIVERY_DRIVERS.map(dr => <option key={dr} value={dr}>{dr}</option>)}
                </select>
              )}
              {d.status !== 'entregado' && d.status !== 'cancelado' && (
                <Button size="sm" onClick={() => advance(d.id)}>
                  Avanzar <ChevronRight size={14} />
                </Button>
              )}
              {d.status === 'recibido' && (
                <Button size="sm" variant="ghost" className="text-ops-danger" onClick={() => { deliveryRepository.cancel(d.id); refresh() }}>
                  Cancelar
                </Button>
              )}
            </div>
          </Card>
        ))}
        {active.length === 0 && (
          <Card className="p-8 text-center text-slate-500">
            <Truck size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin pedidos activos</p>
          </Card>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo pedido delivery" size="sm">
        <form onSubmit={handleCreate} className="p-5 space-y-3">
          <Input label="Cliente" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} required />
          <Input label="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Dirección" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
          <Input label="Total estimado" type="number" value={form.total} onChange={e => setForm(f => ({ ...f, total: Number(e.target.value) }))} />
          <Input label="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" className="w-full">Crear pedido</Button>
        </form>
      </Modal>
    </div>
  )
}
