import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Star, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import { crmRepository } from '@/repositories/crmRepository'
import { toast } from '@/components/ui/Toast'
import { useTenantContext } from '@/hooks/useTenantContext'
import type { Customer } from '@/types/demo'

const SEGMENT_VARIANT: Record<Customer['segment'], 'amber' | 'success' | 'info'> = {
  vip: 'amber',
  frecuente: 'success',
  nuevo: 'info',
}

const SEGMENT_LABEL: Record<Customer['segment'], string> = {
  vip: 'VIP',
  frecuente: 'Frecuente',
  nuevo: 'Nuevo',
}

export default function CustomersPage() {
  const ctx = useTenantContext()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState({ count: 0, vip: 0, ltv: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [saleOpen, setSaleOpen] = useState(false)
  const [saleCustomerId, setSaleCustomerId] = useState<string | null>(null)
  const [saleAmount, setSaleAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [selected, setSelected] = useState<Customer | null>(null)

  const load = useCallback(async () => {
    if (!ctx) return
    setLoading(true)
    try {
      const all = await crmRepository.getCustomers(ctx)
      const list = search.trim()
        ? await crmRepository.search(ctx, search)
        : all
      setCustomers(list)
      setStats({
        count: all.length,
        vip: all.filter(c => c.segment === 'vip').length,
        ltv: all.reduce((s, c) => s + c.total_spent, 0),
      })
      setSelected(prev => prev ? list.find(c => c.id === prev.id) || all.find(c => c.id === prev.id) || null : null)
    } finally {
      setLoading(false)
    }
  }, [ctx, search])

  useEffect(() => { load() }, [load])

  const vipCount = stats.vip
  const ltvTotal = stats.ltv

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ctx) return
    setSaving(true)
    try {
      await crmRepository.addCustomer(ctx, form)
      toast('Cliente registrado', 'success')
      setCreateOpen(false)
      setForm({ name: '', email: '', phone: '' })
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo registrar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const openSale = (id: string) => {
    setSaleCustomerId(id)
    setSaleAmount('')
    setSaleOpen(true)
  }

  const handleSale = async () => {
    if (!ctx || !saleCustomerId) return
    const amount = Number(saleAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast('Ingresa un monto válido', 'error')
      return
    }
    setSaving(true)
    try {
      const updated = await crmRepository.recordSale(ctx, saleCustomerId, amount)
      if (!updated) {
        toast('Cliente no encontrado', 'error')
        return
      }
      const earned = updated.points - (customers.find(c => c.id === saleCustomerId)?.points || 0)
      toast(`Venta registrada — +${earned} puntos`, 'success')
      setSaleOpen(false)
      setSaleCustomerId(null)
      await load()
      if (selected?.id === saleCustomerId) setSelected(updated)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo registrar la venta', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRedeem = async () => {
    if (!ctx || !selected) return
    setSaving(true)
    try {
      const updated = await crmRepository.redeemPoints(ctx, selected.id, 100)
      if (!updated) {
        toast('Puntos insuficientes', 'error')
        return
      }
      toast('100 puntos canjeados — $50 descuento', 'success')
      setSelected(updated)
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">CRM</p>
          <h1 className="text-2xl font-black text-slate-800">Clientes y CRM</h1>
          <p className="text-sm text-slate-500">Perfil 360°, segmentación y puntos de lealtad</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Nuevo cliente</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-mono font-black">{stats.count}</p>
          <p className="text-[10px] text-slate-500 uppercase">Clientes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-mono font-black text-brand-600">{vipCount}</p>
          <p className="text-[10px] text-slate-500 uppercase">VIP</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-mono font-black">{formatCurrency(ltvTotal)}</p>
          <p className="text-[10px] text-slate-500 uppercase">LTV total</p>
        </Card>
      </div>

      <Input
        placeholder="Buscar por nombre, teléfono o email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        icon={<Search size={15} />}
      />

      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Cargando clientes...</p>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">
              {search.trim() ? 'Sin resultados para tu búsqueda' : 'Aún no hay clientes'}
            </p>
            <p className="text-sm mb-4">
              {search.trim() ? 'Prueba otro nombre, teléfono o email.' : 'Registra tu primer cliente para empezar.'}
            </p>
            {!search.trim() && (
              <Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={14} /> Nuevo cliente</Button>
            )}
          </div>
        ) : (
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
                    <p className="font-semibold flex items-center gap-1">
                      {c.segment === 'vip' && <Star size={12} className="text-brand-500" />}
                      {c.name}
                    </p>
                    <p className="text-xs text-slate-500">{c.phone || c.email || 'Sin contacto'}</p>
                  </td>
                  <td className="px-4 py-3">{c.visits}</td>
                  <td className="px-4 py-3 font-mono text-brand-600">{c.points}</td>
                  <td className="px-4 py-3 font-mono">{formatCurrency(c.total_spent)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={SEGMENT_VARIANT[c.segment]} className="uppercase">{SEGMENT_LABEL[c.segment]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); openSale(c.id) }}>
                      <DollarSign size={12} /> Registrar venta
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo cliente" size="sm">
        <form onSubmit={handleCreate} className="p-5 space-y-3">
          <Input label="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="55 1234 5678" />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Button type="submit" className="w-full" loading={saving}>Registrar</Button>
        </form>
      </Modal>

      <Modal open={saleOpen} onClose={() => setSaleOpen(false)} title="Registrar venta" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">
            Cliente: <strong>{customers.find(c => c.id === saleCustomerId)?.name}</strong>
          </p>
          <Input
            label="Monto de la venta"
            type="number"
            min="1"
            step="0.01"
            value={saleAmount}
            onChange={e => setSaleAmount(e.target.value)}
            placeholder="485"
          />
          <p className="text-xs text-slate-500">Se suman puntos: 1 por cada $10 (doble los martes).</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setSaleOpen(false)}>Cancelar</Button>
            <Button className="flex-1" loading={saving} onClick={handleSale} disabled={!saleAmount}>Confirmar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} size="sm">
        {selected && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-slate-500 text-xs">Visitas</p><p className="font-bold">{selected.visits}</p></div>
              <div><p className="text-slate-500 text-xs">Puntos</p><p className="font-bold text-brand-600">{selected.points}</p></div>
              <div><p className="text-slate-500 text-xs">Gasto total</p><p className="font-bold">{formatCurrency(selected.total_spent)}</p></div>
              <div>
                <p className="text-slate-500 text-xs">Segmento</p>
                <Badge variant={SEGMENT_VARIANT[selected.segment]} className="uppercase">{SEGMENT_LABEL[selected.segment]}</Badge>
              </div>
            </div>
            {(selected.phone || selected.email) && (
              <div className="text-sm text-slate-600 space-y-1">
                {selected.phone && <p>Tel: {selected.phone}</p>}
                {selected.email && <p>Email: {selected.email}</p>}
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => { openSale(selected.id); setSelected(null) }}>
              <DollarSign size={14} /> Registrar venta
            </Button>
            {selected.points >= 100 && (
              <Button variant="outline" className="w-full" loading={saving} onClick={handleRedeem}>
                Canjear 100 pts → $50
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
