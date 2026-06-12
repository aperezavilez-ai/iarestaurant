import { useState } from 'react'
import { Plus, Search, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import { crmRepository } from '@/repositories/crmRepository'
import { toast } from '@/components/ui/Toast'
import type { Customer } from '@/types/demo'

const SEGMENT_VARIANT: Record<Customer['segment'], 'amber' | 'success' | 'info'> = {
  vip: 'amber',
  frecuente: 'success',
  nuevo: 'info',
}

export default function CustomersPage() {
  const [, setTick] = useState(0)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [selected, setSelected] = useState<Customer | null>(null)

  const refresh = () => setTick(t => t + 1)
  const customers = search ? crmRepository.search(search) : crmRepository.getCustomers()

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    crmRepository.addCustomer(form)
    toast('Cliente registrado', 'success')
    setCreateOpen(false)
    setForm({ name: '', email: '', phone: '' })
    refresh()
  }

  const handleSale = (id: string, amount: number) => {
    crmRepository.recordSale(id, amount)
    toast(`Venta registrada — +${Math.floor(amount / 10)} puntos`, 'success')
    refresh()
    setSelected(crmRepository.getCustomer(id) || null)
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Fase 32</p>
          <h1 className="text-2xl font-black text-slate-800">Clientes y CRM</h1>
          <p className="text-sm text-slate-500">Perfil 360°, segmentación y puntos de lealtad</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Nuevo cliente</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center"><p className="text-2xl font-mono font-black">{customers.length}</p><p className="text-[10px] text-slate-500 uppercase">Clientes</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-mono font-black text-brand-600">{crmRepository.getBySegment('vip').length}</p><p className="text-[10px] text-slate-500 uppercase">VIP</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-mono font-black">{formatCurrency(customers.reduce((s, c) => s + c.total_spent, 0))}</p><p className="text-[10px] text-slate-500 uppercase">LTV total</p></Card>
      </div>

      <Input placeholder="Buscar por nombre, teléfono o email..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={15} />} />

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            {['Cliente', 'Visitas', 'Puntos', 'Gasto total', 'Segmento', ''].map(h => (
              <th key={h || 'a'} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-brand-50/30 cursor-pointer" onClick={() => setSelected(c)}>
                <td className="px-4 py-3">
                  <p className="font-semibold flex items-center gap-1">{c.segment === 'vip' && <Star size={12} className="text-brand-500" />}{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone || c.email}</p>
                </td>
                <td className="px-4 py-3">{c.visits}</td>
                <td className="px-4 py-3 font-mono text-brand-600">{c.points}</td>
                <td className="px-4 py-3 font-mono">{formatCurrency(c.total_spent)}</td>
                <td className="px-4 py-3"><Badge variant={SEGMENT_VARIANT[c.segment]} className="uppercase">{c.segment}</Badge></td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleSale(c.id, 485) }}>+ Venta demo</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo cliente" size="sm">
        <form onSubmit={handleCreate} className="p-5 space-y-3">
          <Input label="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Button type="submit" className="w-full">Registrar</Button>
        </form>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} size="sm">
        {selected && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-slate-500 text-xs">Visitas</p><p className="font-bold">{selected.visits}</p></div>
              <div><p className="text-slate-500 text-xs">Puntos</p><p className="font-bold text-brand-600">{selected.points}</p></div>
              <div><p className="text-slate-500 text-xs">Gasto total</p><p className="font-bold">{formatCurrency(selected.total_spent)}</p></div>
              <div><p className="text-slate-500 text-xs">Segmento</p><Badge variant={SEGMENT_VARIANT[selected.segment]} className="uppercase">{selected.segment}</Badge></div>
            </div>
            {selected.points >= 100 && (
              <Button variant="outline" className="w-full" onClick={() => {
                if (crmRepository.redeemPoints(selected.id, 100)) {
                  toast('100 puntos canjeados — $50 descuento', 'success')
                  refresh()
                  setSelected(crmRepository.getCustomer(selected.id) || null)
                }
              }}>Canjear 100 pts → $50</Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
