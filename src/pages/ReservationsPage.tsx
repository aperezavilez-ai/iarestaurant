import { useEffect, useState, useCallback } from 'react'
import { Calendar, Plus, Users, Clock, CheckCircle, XCircle, Armchair } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import { useTenantContext } from '@/hooks/useTenantContext'
import { reservationRepository } from '@/repositories/reservationRepository'
import { tableRepository } from '@/repositories/tableRepository'
import type { Reservation } from '@/types/demo'
import type { RestaurantTable } from '@/types'
import { cn } from '@/lib/utils'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

const STATUS_BADGE: Record<Reservation['status'], 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  confirmada: 'success',
  pendiente: 'warning',
  cancelada: 'danger',
  completada: 'info',
  en_espera: 'default',
}

export default function ReservationsPage() {
  const ctx = useTenantContext()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [waitlist, setWaitlist] = useState(reservationRepository.getWaitlist())
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [dateFilter, setDateFilter] = useState(todayStr())
  const [createOpen, setCreateOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState<Reservation | null>(null)
  const [form, setForm] = useState({ customer_name: '', phone: '', guests: 2, date: todayStr(), time: '20:00', notes: '' })
  const [waitForm, setWaitForm] = useState({ customer_name: '', guests: 2, phone: '' })

  const load = useCallback(() => {
    setReservations(reservationRepository.getByDate(dateFilter))
    setWaitlist(reservationRepository.getWaitlist())
    if (ctx) tableRepository.getTables(ctx).then(setTables)
  }, [ctx, dateFilter])

  useEffect(() => { load() }, [load])

  const freeTables = tables.filter(t => t.status === 'libre' && t.capacity >= (assignOpen?.guests || 0))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await reservationRepository.create({ ...form, guests: Number(form.guests) })
    toast('Reservación creada', 'success')
    setCreateOpen(false)
    setForm({ customer_name: '', phone: '', guests: 2, date: todayStr(), time: '20:00', notes: '' })
    load()
  }

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault()
    reservationRepository.addToWaitlist({ ...waitForm, guests: Number(waitForm.guests) })
    toast('Agregado a lista de espera', 'success')
    setWaitForm({ customer_name: '', guests: 2, phone: '' })
    load()
  }

  const handleConfirm = async (id: string, tableNum?: number) => {
    if (!ctx) return
    await reservationRepository.confirm(ctx, id, tableNum)
    toast(tableNum ? `Mesa ${tableNum} asignada` : 'Reservación confirmada', 'success')
    setAssignOpen(null)
    load()
  }

  const handleSeat = async (id: string) => {
    if (!ctx) return
    await reservationRepository.seat(ctx, id)
    toast('Cliente sentado — mesa ocupada', 'success')
    load()
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Fase 21</p>
          <h1 className="text-2xl font-black text-slate-800">Reservaciones</h1>
          <p className="text-sm text-slate-500">Calendario, confirmaciones y lista de espera</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Nueva reservación</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hoy', value: todayStr() },
          { label: 'Mañana', value: tomorrowStr() },
          { label: 'Todas', value: 'all' },
        ].map(d => (
          <button key={d.value} onClick={() => setDateFilter(d.value)}
            className={cn('rounded-xl p-3 border text-sm font-bold transition-all',
              dateFilter === d.value ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-command-border bg-white text-slate-600')}>
            <Calendar size={14} className="inline mr-1" />{d.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-command-border bg-brand-50/50 flex justify-between items-center">
              <p className="font-bold text-slate-800">Reservaciones {dateFilter !== 'all' ? `· ${dateFilter}` : ''}</p>
              <Badge>{reservations.length}</Badge>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b"><tr>
                {['Cliente', 'Pers.', 'Hora', 'Mesa', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y">
                {(dateFilter === 'all' ? reservationRepository.getAll() : reservations).map(r => (
                  <tr key={r.id} className="hover:bg-brand-50/30">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.customer_name}</p>
                      {r.phone && <p className="text-[10px] text-slate-500">{r.phone}</p>}
                    </td>
                    <td className="px-4 py-3">{r.guests}</td>
                    <td className="px-4 py-3 font-mono">{r.time}</td>
                    <td className="px-4 py-3">{r.table_number || '—'}</td>
                    <td className="px-4 py-3"><Badge variant={STATUS_BADGE[r.status]} className="capitalize">{r.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {r.status === 'pendiente' && (
                          <button onClick={() => setAssignOpen(r)} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-600" title="Confirmar">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {r.status === 'confirmada' && r.table_id && (
                          <button onClick={() => handleSeat(r.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-ops-success" title="Sentar">
                            <Armchair size={14} />
                          </button>
                        )}
                        {r.status !== 'cancelada' && r.status !== 'completada' && (
                          <button onClick={() => { if (ctx) reservationRepository.cancel(ctx, r.id).then(load); toast('Cancelada', 'info') }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-ops-danger" title="Cancelar">
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Clock size={16} /> Lista de espera</p>
            <form onSubmit={handleWaitlist} className="space-y-2 mb-4">
              <Input placeholder="Nombre" value={waitForm.customer_name} onChange={e => setWaitForm(f => ({ ...f, customer_name: e.target.value }))} required />
              <div className="flex gap-2">
                <Input type="number" min={1} placeholder="Pers." value={waitForm.guests} onChange={e => setWaitForm(f => ({ ...f, guests: Number(e.target.value) }))} />
                <Button type="submit" size="sm" className="shrink-0">Agregar</Button>
              </div>
            </form>
            {waitlist.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Sin espera</p>
            ) : waitlist.map((w, i) => (
              <div key={w.id} className="flex justify-between items-center py-2 border-b border-command-border last:border-0">
                <div>
                  <p className="text-sm font-semibold">{i + 1}. {w.customer_name}</p>
                  <p className="text-[10px] text-slate-500"><Users size={10} className="inline" /> {w.guests} · ~{w.estimated_wait} min</p>
                </div>
                <button onClick={() => { reservationRepository.removeFromWaitlist(w.id); load() }} className="text-[10px] text-ops-danger">Quitar</button>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva reservación" size="sm">
        <form onSubmit={handleCreate} className="p-5 space-y-3">
          <Input label="Cliente" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} required />
          <Input label="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Personas" type="number" min={1} value={form.guests} onChange={e => setForm(f => ({ ...f, guests: Number(e.target.value) }))} />
            <Input label="Hora" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
          <Input label="Fecha" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Input label="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" className="w-full">Crear reservación</Button>
        </form>
      </Modal>

      <Modal open={!!assignOpen} onClose={() => setAssignOpen(null)} title="Asignar mesa" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">{assignOpen?.customer_name} · {assignOpen?.guests} personas</p>
          <Button variant="outline" className="w-full" onClick={() => assignOpen && handleConfirm(assignOpen.id)}>
            Confirmar sin mesa
          </Button>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {freeTables.map(t => (
              <button key={t.id} onClick={() => assignOpen && handleConfirm(assignOpen.id, t.number)}
                className="p-3 rounded-xl border border-command-border font-mono font-bold hover:border-brand-400 hover:bg-brand-50">
                {t.number}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
