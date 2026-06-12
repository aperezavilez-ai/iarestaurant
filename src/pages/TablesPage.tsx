import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn, formatCurrency } from '@/lib/utils'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Users, Clock, RefreshCw, LayoutGrid, Map, Split, UserCheck, ArrowRightLeft, Merge, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { useTenantContext } from '@/hooks/useTenantContext'
import { useOpsSync } from '@/hooks/useOpsSync'
import { tableRepository } from '@/repositories/tableRepository'
import { orderRepository } from '@/repositories/orderRepository'
import { SEED_STAFF } from '@/data/seed'
import { toast } from '@/components/ui/Toast'
import type { RestaurantTable, TableStatus, Order } from '@/types'

const statusLabel: Record<TableStatus, string> = {
  libre: 'Libre', ocupada: 'Ocupada', reservada: 'Reservada', cobro_pendiente: 'Por cobrar',
}

const STATUS_STYLE: Record<TableStatus, { border: string; bg: string; dot: string; glow?: string }> = {
  libre: { border: 'border-ops-success/40', bg: 'bg-ops-success/5', dot: 'bg-ops-success' },
  ocupada: { border: 'border-ops-danger/40', bg: 'bg-ops-danger/5', dot: 'bg-ops-danger', glow: 'shadow-[0_0_16px_rgba(248,113,113,0.2)]' },
  reservada: { border: 'border-ops-info/40', bg: 'bg-ops-info/5', dot: 'bg-ops-info' },
  cobro_pendiente: { border: 'border-ops-warning/40', bg: 'bg-ops-warning/5', dot: 'bg-ops-warning' },
}

export default function TablesPage() {
  const ctx = useTenantContext()
  const navigate = useNavigate()
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<TableStatus | 'todas'>('todas')
  const [selectedArea, setSelectedArea] = useState('todas')
  const [view, setView] = useState<'grid' | 'plano'>('grid')
  const [selected, setSelected] = useState<RestaurantTable | null>(null)
  const [splitModal, setSplitModal] = useState(false)
  const [splitParts, setSplitParts] = useState(2)
  const [splitTotal, setSplitTotal] = useState(0)
  const [transferModal, setTransferModal] = useState(false)
  const [mergeModal, setMergeModal] = useState(false)
  const [targetTableId, setTargetTableId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!ctx) return
    const [t, o] = await Promise.all([
      tableRepository.getTables(ctx),
      orderRepository.getActiveOrders(ctx),
    ])
    setTables(t)
    setOrders(o)
  }, [ctx])

  useOpsSync(load, 4000)
  useEffect(() => { load() }, [load])

  const areas = [...new Set(tables.map(t => t.area?.name))].filter(Boolean)
  const filtered = tables.filter(t =>
    (filter === 'todas' || t.status === filter) &&
    (selectedArea === 'todas' || t.area?.name === selectedArea)
  )

  const counts = {
    libre: tables.filter(t => t.status === 'libre').length,
    ocupada: tables.filter(t => t.status === 'ocupada').length,
    reservada: tables.filter(t => t.status === 'reservada').length,
    cobro_pendiente: tables.filter(t => t.status === 'cobro_pendiente').length,
  }

  const waiters = SEED_STAFF.filter(u => u.role === 'mesero')

  const getOrder = (tableId: string) => orders.find(o => o.table_id === tableId)
  const getWaiterName = (id?: string) => SEED_STAFF.find(u => u.id === id)?.full_name

  const cycleStatus = async (table: RestaurantTable) => {
    if (!ctx) return
    const order: TableStatus[] = ['libre', 'ocupada', 'cobro_pendiente', 'reservada']
    await tableRepository.updateStatus(ctx, table.id, order[(order.indexOf(table.status) + 1) % order.length])
    await load()
  }

  const assignWaiter = async (waiterId: string) => {
    if (!selected) return
    await tableRepository.updateTable({ ...selected, assigned_waiter_id: waiterId })
    toast('Mesero asignado a mesa ' + selected.number, 'success')
    setSelected(null)
    await load()
  }

  const openTable = async () => {
    if (!ctx || !selected) return
    try {
      await tableRepository.openTable(ctx, selected.id)
      toast(`Mesa ${selected.number} abierta`, 'success')
      setSelected(null)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  const goToPOS = (table: RestaurantTable) => {
    navigate(`/app/pos?mesa=${table.number}`)
  }

  const openSplit = async () => {
    if (!ctx || !selected) return
    const order = getOrder(selected.id)
    if (!order) {
      toast('No hay orden activa en esta mesa', 'error')
      return
    }
    const { total } = await orderRepository.splitBill(ctx, order.id, splitParts)
    setSplitTotal(total)
    setSplitModal(true)
  }

  const confirmSplit = () => {
    toast(`Cuenta dividida en ${splitParts} partes de ${formatCurrency(splitTotal / splitParts)}`, 'success')
    setSplitModal(false)
    setSelected(null)
  }

  const confirmTransfer = async () => {
    if (!ctx || !selected || !targetTableId) return
    try {
      await tableRepository.transferTable(ctx, selected.id, targetTableId)
      toast(`Mesa ${selected.number} trasladada`, 'success')
      setTransferModal(false)
      setTargetTableId(null)
      setSelected(null)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  const confirmMerge = async () => {
    if (!ctx || !selected || !targetTableId) return
    try {
      await tableRepository.mergeTables(ctx, selected.id, targetTableId)
      toast('Mesas unidas correctamente', 'success')
      setMergeModal(false)
      setTargetTableId(null)
      setSelected(null)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  const TableCard = ({ table }: { table: RestaurantTable }) => {
    const style = STATUS_STYLE[table.status]
    const mins = table.opened_at ? Math.floor((Date.now() - new Date(table.opened_at).getTime()) / 60000) : 0
    const order = getOrder(table.id)
    const waiter = getWaiterName(table.assigned_waiter_id)

    return (
      <button
        onClick={() => setSelected(table)}
        onDoubleClick={() => cycleStatus(table)}
        className={cn('rounded-2xl border-2 p-4 text-center transition-all hover:scale-105 min-h-[100px]', style.border, style.bg, style.glow)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={cn('w-2.5 h-2.5 rounded-full', style.dot, table.status === 'ocupada' && 'animate-pulse-live')} />
          <span className="text-[9px] font-mono text-slate-600">{table.area?.name?.slice(0, 3)}</span>
        </div>
        <p className="text-3xl font-black text-slate-800">{table.number}</p>
        <div className="flex items-center justify-center gap-1 mt-1 text-slate-500">
          <Users size={10} /><span className="text-[10px] font-mono">{table.capacity}</span>
        </div>
        <p className="text-[10px] font-mono font-bold text-slate-400 mt-2 uppercase">{statusLabel[table.status]}</p>
        {waiter && <p className="text-[9px] text-brand-600 truncate mt-0.5">{waiter.split(' ')[0]}</p>}
        {order && <p className="text-[9px] font-mono text-slate-500 mt-0.5">{formatCurrency(order.total)}</p>}
        {table.status === 'ocupada' && mins > 0 && (
          <p className="text-[10px] text-ops-danger font-mono flex items-center justify-center gap-0.5 mt-1">
            <Clock size={9} />{mins}m
          </p>
        )}
      </button>
    )
  }

  const freeTables = tables.filter(t => t.status === 'libre' && t.id !== selected?.id)

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Libres', count: counts.libre, color: 'text-ops-success' },
          { label: 'Ocupadas', count: counts.ocupada, color: 'text-ops-danger' },
          { label: 'Reservadas', count: counts.reservada, color: 'text-ops-info' },
          { label: 'Por cobrar', count: counts.cobro_pendiente, color: 'text-ops-warning' },
        ].map(s => (
          <div key={s.label} className="glass-panel rounded-2xl p-4 text-center border border-command-border bg-white">
            <p className={cn('text-3xl font-mono font-black', s.color)}>{s.count}</p>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {(['todas', 'libre', 'ocupada', 'reservada', 'cobro_pendiente'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-bold',
                    filter === f ? 'bg-brand-100 text-brand-700 border border-brand-300' : 'text-slate-500 hover:text-brand-700')}>
                  {f === 'todas' ? 'Todas' : statusLabel[f]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex rounded-xl border border-command-border overflow-hidden">
                <button onClick={() => setView('grid')} className={cn('px-3 py-2 text-xs', view === 'grid' ? 'bg-brand-100 text-brand-700' : 'text-slate-500')}><LayoutGrid size={14} /></button>
                <button onClick={() => setView('plano')} className={cn('px-3 py-2 text-xs', view === 'plano' ? 'bg-brand-100 text-brand-700' : 'text-slate-500')}><Map size={14} /></button>
              </div>
              <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)}
                className="text-xs bg-white border border-command-border rounded-xl px-3 py-2 text-slate-600 focus:outline-none">
                <option value="todas">Todas las áreas</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <Button variant="ghost" size="sm" onClick={load}><RefreshCw size={14} /> Sync</Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {view === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {filtered.map(table => <TableCard key={table.id} table={table} />)}
            </div>
          ) : (
            <div className="space-y-6">
              {areas.map(area => {
                const areaTables = filtered.filter(t => t.area?.name === area)
                if (!areaTables.length) return null
                return (
                  <div key={area}>
                    <p className="text-xs font-mono text-orange-600 uppercase tracking-widest mb-3">{area}</p>
                    <div className="relative bg-command-elevated rounded-2xl p-8 min-h-[200px] border-2 border-dashed border-command-border">
                      <div className="flex flex-wrap gap-4 justify-center">
                        {areaTables.map(table => (
                          <div key={table.id} className="w-24">
                            <TableCard table={table} />
                          </div>
                        ))}
                      </div>
                      <p className="text-center text-[10px] text-slate-400 mt-4 font-mono">PLANO VISUAL — Doble clic para cambiar estado</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Mesa ${selected.number}` : ''} size="sm">
        {selected && (
          <div className="p-5 space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge className="capitalize">{statusLabel[selected.status]}</Badge>
              <Badge variant="info">{selected.area?.name}</Badge>
              <Badge variant="default">{selected.capacity} personas</Badge>
            </div>

            {getOrder(selected.id) && (
              <div className="bg-brand-50 rounded-xl p-3 border border-brand-200">
                <p className="text-xs font-mono text-slate-500">Orden activa</p>
                <p className="font-bold text-brand-700">{getOrder(selected.id)!.folio}</p>
                <p className="text-lg font-mono font-black">{formatCurrency(getOrder(selected.id)!.total)}</p>
                <p className="text-[10px] text-slate-500">{(getOrder(selected.id)!.items || []).length} productos</p>
              </div>
            )}

            {selected.assigned_waiter_id && (
              <p className="text-sm text-slate-600">Mesero: <strong>{getWaiterName(selected.assigned_waiter_id)}</strong></p>
            )}

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><UserCheck size={14} /> Asignar mesero</p>
              <div className="flex gap-2 flex-wrap">
                {waiters.map(w => (
                  <Button key={w.id} size="sm" variant="outline" onClick={() => assignWaiter(w.id)}>{w.full_name}</Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => goToPOS(selected)}>
                <ShoppingBag size={14} /> Ir a POS
              </Button>
              {(selected.status === 'libre' || selected.status === 'reservada') && (
                <Button variant="outline" onClick={openTable}>
                  <UtensilsCrossed size={14} /> Abrir mesa
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={openSplit} disabled={!getOrder(selected.id)}>
                <Split size={14} /> Dividir cuenta
              </Button>
              <Button variant="outline" onClick={() => { setTransferModal(true); setTargetTableId(null) }} disabled={selected.status === 'libre'}>
                <ArrowRightLeft size={14} /> Cambiar mesa
              </Button>
              <Button variant="outline" onClick={() => { setMergeModal(true); setTargetTableId(null) }} disabled={selected.status === 'libre'}>
                <Merge size={14} /> Unir mesas
              </Button>
              <Button onClick={() => { cycleStatus(selected); setSelected(null) }}>Cambiar estado</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={splitModal} onClose={() => setSplitModal(false)} title="División de cuenta" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">Mesa {selected?.number} — Total {formatCurrency(splitTotal)}</p>
          <div className="flex gap-2">
            {[2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setSplitParts(n)}
                className={cn('flex-1 py-3 rounded-xl border font-bold', splitParts === n ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-command-border')}>
                {n}
              </button>
            ))}
          </div>
          <div className="bg-command-elevated rounded-xl p-4 space-y-2">
            {Array.from({ length: splitParts }, (_, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>Persona {i + 1}</span>
                <span className="font-mono font-bold">{formatCurrency(splitTotal / splitParts)}</span>
              </div>
            ))}
          </div>
          <Button className="w-full" onClick={confirmSplit}>Confirmar división</Button>
        </div>
      </Modal>

      <Modal open={transferModal} onClose={() => setTransferModal(false)} title="Trasladar a otra mesa" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">Mesa {selected?.number} → selecciona destino libre:</p>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {freeTables.map(t => (
              <button key={t.id} onClick={() => setTargetTableId(t.id)}
                className={cn('p-3 rounded-xl border font-mono font-bold', targetTableId === t.id ? 'border-brand-400 bg-brand-50' : 'border-command-border')}>
                {t.number}
              </button>
            ))}
          </div>
          <Button className="w-full" disabled={!targetTableId} onClick={confirmTransfer}>Confirmar traslado</Button>
        </div>
      </Modal>

      <Modal open={mergeModal} onClose={() => setMergeModal(false)} title="Unir mesas" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">Unir mesa {selected?.number} con:</p>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {tables.filter(t => t.id !== selected?.id).map(t => (
              <button key={t.id} onClick={() => setTargetTableId(t.id)}
                className={cn('p-3 rounded-xl border font-mono font-bold text-sm', targetTableId === t.id ? 'border-brand-400 bg-brand-50' : 'border-command-border',
                  t.status === 'ocupada' && 'ring-1 ring-ops-danger/30')}>
                {t.number}
              </button>
            ))}
          </div>
          <Button className="w-full" disabled={!targetTableId} onClick={confirmMerge}>Confirmar unión</Button>
        </div>
      </Modal>
    </div>
  )
}
