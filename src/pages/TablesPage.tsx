import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn, formatCurrency } from '@/lib/utils'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { RefreshCw, LayoutGrid, Map as MapIcon, Split, UserCheck, ArrowRightLeft, Merge, ShoppingBag, UtensilsCrossed, Loader2, Plus, CreditCard, UserCircle, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useTenantContext } from '@/hooks/useTenantContext'
import { useOpsSync } from '@/hooks/useOpsSync'
import { tableRepository } from '@/repositories/tableRepository'
import { orderRepository } from '@/repositories/orderRepository'
import { localDb } from '@/lib/localDb'
import { userRepository } from '@/repositories/userRepository'
import { toast } from '@/components/ui/Toast'
import { TableCard } from '@/components/tables/TableCard'
import { sameOrders, sameTables } from '@/lib/opsEquality'
import { usePOSStore } from '@/store/posStore'
import { crmRepository } from '@/repositories/crmRepository'
import type { RestaurantTable, TableStatus, Order, TableArea, User, OrderItem, OrderSplitMode } from '@/types'
import { buildEqualSplitParts, buildItemSplitParts, partItemLabels } from '@/lib/splitBill'
import type { Customer } from '@/types/demo'

const statusLabel: Record<TableStatus, string> = {
  libre: 'Libre', ocupada: 'Ocupada', reservada: 'Reservada', cobro_pendiente: 'Por cobrar',
}

const AREA_COLORS = ['#f59000', '#16213e', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

export default function TablesPage() {
  const ctx = useTenantContext()
  const navigate = useNavigate()
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [areaList, setAreaList] = useState<TableArea[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TableStatus | 'todas'>('todas')
  const [selectedArea, setSelectedArea] = useState('todas')
  const [view, setView] = useState<'grid' | 'plano'>('grid')
  const [selected, setSelected] = useState<RestaurantTable | null>(null)
  const [addAreaModal, setAddAreaModal] = useState(false)
  const [addTableModal, setAddTableModal] = useState(false)
  const [areaForm, setAreaForm] = useState({ name: '', color: AREA_COLORS[0] })
  const [tableForm, setTableForm] = useState({ number: '', capacity: '4', area_id: '' })
  const [saving, setSaving] = useState(false)
  const [splitModal, setSplitModal] = useState(false)
  const [splitMode, setSplitMode] = useState<OrderSplitMode>('equal')
  const [splitParts, setSplitParts] = useState(3)
  const [splitTotal, setSplitTotal] = useState(0)
  const [splitSubtotal, setSplitSubtotal] = useState(0)
  const [splitNames, setSplitNames] = useState(['', '', ''])
  const [splitOrderItems, setSplitOrderItems] = useState<OrderItem[]>([])
  const [splitItemAssign, setSplitItemAssign] = useState<Record<string, number>>({})
  const [splitSaving, setSplitSaving] = useState(false)
  const [transferModal, setTransferModal] = useState(false)
  const [mergeModal, setMergeModal] = useState(false)
  const [targetTableId, setTargetTableId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [tableCustomerId, setTableCustomerId] = useState<string | null>(null)
  const [tableCustomerName, setTableCustomerName] = useState<string | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [staff, setStaff] = useState<User[]>([])

  const load = useCallback(async () => {
    if (!ctx) return
    const localTables = await localDb.getTables(ctx.tenantId, ctx.sucursalId)
    const localAreas = await localDb.getAreas(ctx.tenantId, ctx.sucursalId)
    const localOrders = await localDb.getActiveOrders(ctx.tenantId, ctx.sucursalId)
    if (localTables.length) {
      setTables(prev => sameTables(prev, localTables) ? prev : localTables)
      setLoading(false)
    }
    if (localAreas.length) setAreaList(localAreas)
    if (localOrders.length) setOrders(prev => sameOrders(prev, localOrders) ? prev : localOrders)

    const [t, o, a] = await Promise.all([
      tableRepository.getTables(ctx),
      orderRepository.getActiveOrders(ctx),
      tableRepository.getAreas(ctx),
    ])
    setTables(prev => sameTables(prev, t) ? prev : t)
    setOrders(prev => sameOrders(prev, o) ? prev : o)
    setAreaList(a)
    setLoading(false)
  }, [ctx])

  useOpsSync(load, 4000)
  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!ctx) return
    crmRepository.getCustomers(ctx).then(setCustomers)
  }, [ctx])

  useEffect(() => {
    if (!ctx) return
    userRepository.listStaff(ctx).then(setStaff)
  }, [ctx])

  useEffect(() => {
    if (!selected) return
    setTableCustomerId(selected.customer_id || null)
    setTableCustomerName(selected.customer_name || null)
    setCustomerSearch('')
  }, [selected])

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase()
    if (!q) return customers.slice(0, 6)
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    ).slice(0, 6)
  }, [customers, customerSearch])

  const filtered = tables.filter(t =>
    (filter === 'todas' || t.status === filter) &&
    (selectedArea === 'todas' || t.area?.name === selectedArea)
  )

  const nextTableNumber = useMemo(() => {
    if (!tables.length) return 1
    return Math.max(...tables.map(t => t.number)) + 1
  }, [tables])

  const openAddArea = () => {
    setAreaForm({ name: '', color: AREA_COLORS[areaList.length % AREA_COLORS.length] })
    setAddAreaModal(true)
  }

  const openAddTable = () => {
    if (!areaList.length) {
      toast('Primero crea un área para ubicar la mesa', 'error')
      setAddAreaModal(true)
      return
    }
    setTableForm({
      number: String(nextTableNumber),
      capacity: '4',
      area_id: areaList[0].id,
    })
    setAddTableModal(true)
  }

  const handleCreateArea = async () => {
    if (!ctx || !areaForm.name.trim()) return
    setSaving(true)
    try {
      const area = await tableRepository.createArea(ctx, {
        name: areaForm.name,
        color: areaForm.color,
      })
      toast(`Área "${area.name}" creada`, 'success')
      setAddAreaModal(false)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo crear el área', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateTable = async () => {
    if (!ctx || !tableForm.area_id || !tableForm.number) return
    const number = Number(tableForm.number)
    const capacity = Number(tableForm.capacity)
    if (!Number.isFinite(number) || number < 1) {
      toast('Número de mesa inválido', 'error')
      return
    }
    if (!Number.isFinite(capacity) || capacity < 1) {
      toast('Capacidad inválida', 'error')
      return
    }
    setSaving(true)
    try {
      const table = await tableRepository.createTable(ctx, {
        number,
        capacity,
        area_id: tableForm.area_id,
      })
      toast(`Mesa ${table.number} agregada`, 'success')
      setAddTableModal(false)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo crear la mesa', 'error')
    } finally {
      setSaving(false)
    }
  }

  const counts = {
    libre: tables.filter(t => t.status === 'libre').length,
    ocupada: tables.filter(t => t.status === 'ocupada').length,
    reservada: tables.filter(t => t.status === 'reservada').length,
    cobro_pendiente: tables.filter(t => t.status === 'cobro_pendiente').length,
  }

  const waiters = staff.filter(u => u.role === 'mesero')

  const getOrder = useCallback((tableId: string) => orders.find(o => o.table_id === tableId), [orders])
  const getWaiterName = useCallback((id?: string) => staff.find(u => u.id === id)?.full_name, [staff])

  const handleSelectTable = useCallback((table: RestaurantTable) => setSelected(table), [])

  const cycleStatus = useCallback(async (table: RestaurantTable) => {
    if (!ctx) return
    const statusCycle: TableStatus[] = ['libre', 'ocupada', 'cobro_pendiente', 'reservada']
    await tableRepository.updateStatus(ctx, table.id, statusCycle[(statusCycle.indexOf(table.status) + 1) % statusCycle.length])
    await load()
  }, [ctx, load])

  const ordersByTable = useMemo(() => {
    const map = new Map<string, Order>()
    for (const order of orders) {
      if (order.table_id) map.set(order.table_id, order)
    }
    return map
  }, [orders])

  const waiterNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const user of staff) map.set(user.id, user.full_name)
    return map
  }, [staff])

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
      await tableRepository.openTable(ctx, selected.id, {
        customerId: tableCustomerId || undefined,
        customerName: tableCustomerName || undefined,
      })
      toast(`Mesa ${selected.number} abierta${tableCustomerName ? ` · ${tableCustomerName}` : ''}`, 'success')
      setSelected(null)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  const assignTableCustomer = async (customerId: string | null, customerName: string | null) => {
    if (!ctx || !selected) return
    try {
      await tableRepository.assignCustomer(ctx, selected.id, customerId, customerName)
      setTableCustomerId(customerId)
      setTableCustomerName(customerName)
      toast(customerId ? `Cliente ${customerName} asignado` : 'Cliente quitado de la mesa', 'success')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  const goToPOS = (table: RestaurantTable) => {
    if (table.customer_id) {
      usePOSStore.getState().setCustomer(table.customer_id, table.customer_name || '')
    }
    navigate(`/app/pos?mesa=${table.number}`)
  }

  const goToCollect = (table: RestaurantTable) => {
    const order = getOrder(table.id)
    if (!order) {
      toast('No hay orden activa en esta mesa. Usa POS para crear la venta.', 'error')
      return
    }
    if (order.split_config?.parts?.length) {
      toast('Cuenta dividida — cobra cada parte por separado', 'error')
      return
    }
    usePOSStore.getState().loadFromOrder(order, { id: table.id, number: table.number })
    navigate(`/app/pos?mesa=${table.number}&cobrar=1`)
    setSelected(null)
  }

  const goToCollectPart = (
    table: RestaurantTable,
    order: Order,
    part: { id: string; label: string; amount: number }
  ) => {
    usePOSStore.getState().loadFromOrder(order, { id: table.id, number: table.number })
    usePOSStore.getState().loadSplitPart(part.id, part.label, part.amount)
    navigate(`/app/pos?mesa=${table.number}&cobrar=1`)
    setSelected(null)
  }

  const splitPreview = useMemo(() => {
    const labels = splitNames.map((n, i) => n.trim() || `Persona ${i + 1}`)
    if (splitMode === 'equal') {
      return buildEqualSplitParts(splitTotal, labels)
    }
    const parts = labels.map((label, i) => ({
      label,
      item_ids: splitOrderItems.filter((it) => splitItemAssign[it.id] === i).map((it) => it.id),
    }))
    return buildItemSplitParts(
      { subtotal: splitSubtotal, total: splitTotal, items: splitOrderItems },
      parts
    )
  }, [splitMode, splitNames, splitTotal, splitSubtotal, splitOrderItems, splitItemAssign])

  const openSplit = async () => {
    if (!ctx || !selected) return
    const order = getOrder(selected.id)
    if (!order) {
      toast('No hay orden activa en esta mesa', 'error')
      return
    }
    setSplitTotal(order.total)
    setSplitSubtotal(order.subtotal)
    const n = Math.max(2, order.guests || 2)
    const items = order.items || []
    setSplitParts(n)
    setSplitNames(Array.from({ length: n }, (_, i) => `Persona ${i + 1}`))
    setSplitOrderItems(items)
    setSplitItemAssign(Object.fromEntries(items.map((it, i) => [it.id, i % n])))
    setSplitMode('equal')
    setSplitModal(true)
  }

  const confirmSplit = async () => {
    if (!ctx || !selected) return
    const order = getOrder(selected.id)
    if (!order) return
    setSplitSaving(true)
    try {
      if (splitMode === 'equal') {
        const labels = splitNames.map((n, i) => n.trim() || `Persona ${i + 1}`)
        await orderRepository.setupSplitBill(ctx, order.id, { mode: 'equal', labels })
      } else {
        const parts = splitNames.map((label, i) => ({
          label: label.trim() || `Persona ${i + 1}`,
          item_ids: splitOrderItems.filter((it) => splitItemAssign[it.id] === i).map((it) => it.id),
        }))
        await orderRepository.setupSplitBill(ctx, order.id, { mode: 'items', parts })
      }
      toast('Cuenta dividida — cobra cada parte en POS', 'success')
      setSplitModal(false)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al dividir', 'error')
    } finally {
      setSplitSaving(false)
    }
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

  const freeTables = tables.filter(t => t.status === 'libre' && t.id !== selected?.id)

  return (
    <div className="space-y-6">
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
                <button onClick={() => setView('plano')} className={cn('px-3 py-2 text-xs', view === 'plano' ? 'bg-brand-100 text-brand-700' : 'text-slate-500')}><MapIcon size={14} /></button>
              </div>
              <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)}
                className="text-xs bg-white border border-command-border rounded-xl px-3 py-2 text-slate-600 focus:outline-none">
                <option value="todas">Todas las áreas</option>
                {areaList.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={openAddArea}>
                <Plus size={14} /> Área
              </Button>
              <Button size="sm" onClick={openAddTable}>
                <Plus size={14} /> Mesa
              </Button>
              <Button variant="ghost" size="sm" onClick={load}><RefreshCw size={14} /> Sync</Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loading && tables.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-20 text-slate-500 text-sm">
              <Loader2 size={18} className="animate-spin" /> Cargando mesas…
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {filtered.map(table => (
                <TableCard
                  key={table.id}
                  table={table}
                  order={ordersByTable.get(table.id)}
                  waiterName={table.assigned_waiter_id ? waiterNames.get(table.assigned_waiter_id) : undefined}
                  onSelect={handleSelectTable}
                  onCycleStatus={cycleStatus}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {areaList
                .filter(area => selectedArea === 'todas' || area.name === selectedArea)
                .map(area => {
                const areaTables = filtered.filter(t => t.area_id === area.id)
                if (!areaTables.length) return null
                return (
                  <div key={area.id}>
                    <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: area.color }}>{area.name}</p>
                    <div className="relative bg-command-elevated rounded-2xl p-8 min-h-[200px] border-2 border-dashed border-command-border">
                      <div className="flex flex-wrap gap-4 justify-center">
                        {areaTables.map(table => (
                          <div key={table.id} className="w-24">
                            <TableCard
                              table={table}
                              order={ordersByTable.get(table.id)}
                              waiterName={table.assigned_waiter_id ? waiterNames.get(table.assigned_waiter_id) : undefined}
                              onSelect={handleSelectTable}
                              onCycleStatus={cycleStatus}
                            />
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

            {selected.status === 'cobro_pendiente' && !getOrder(selected.id) && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Esta mesa está marcada por cobrar pero no tiene orden activa. Abre la mesa o crea la venta en POS.
              </p>
            )}

            {(selected.status === 'cobro_pendiente' || getOrder(selected.id)) && getOrder(selected.id) && (
              <div className="space-y-2">
                {getOrder(selected.id)!.split_config?.parts?.length ? (
                  <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3 space-y-2">
                    <p className="text-xs font-bold text-slate-700">Cuenta dividida</p>
                    {getOrder(selected.id)!.split_config!.parts.map((part) => (
                      <div key={part.id} className="flex flex-col gap-0.5 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800">{part.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{formatCurrency(part.amount)}</span>
                            {part.paid_at ? (
                              <Badge variant="success">Cobrado</Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => goToCollectPart(selected, getOrder(selected.id)!, part)}
                              >
                                Cobrar
                              </Button>
                            )}
                          </div>
                        </div>
                        {part.item_ids?.length ? (
                          <p className="text-[10px] text-slate-500 truncate">
                            {partItemLabels(getOrder(selected.id)!.items || [], part.item_ids)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <Button className="w-full" onClick={() => goToCollect(selected)}>
                      <CreditCard size={14} /> Cobrar cuenta · {formatCurrency(getOrder(selected.id)!.total)}
                    </Button>
                    <p className="text-[10px] text-slate-500 text-center">
                      Abre caja en Caja si está cerrada → elige método de pago en POS
                    </p>
                  </>
                )}
              </div>
            )}

            {selected.assigned_waiter_id && (
              <p className="text-sm text-slate-600">Mesero: <strong>{getWaiterName(selected.assigned_waiter_id)}</strong></p>
            )}

            <div className="rounded-xl border border-command-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <UserCircle size={14} /> Cliente CRM
                </p>
                {tableCustomerId && (
                  <button type="button" onClick={() => assignTableCustomer(null, null)} className="text-slate-400 hover:text-ops-danger">
                    <X size={14} />
                  </button>
                )}
              </div>
              {tableCustomerId ? (
                <div className="bg-brand-50 rounded-lg px-3 py-2 text-sm font-semibold text-brand-800">
                  {tableCustomerName}
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Buscar cliente por nombre o teléfono..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    className="text-xs h-9"
                  />
                  {filteredCustomers.length > 0 ? (
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            if (selected.status === 'libre' || selected.status === 'reservada') {
                              setTableCustomerId(c.id)
                              setTableCustomerName(c.name)
                            } else {
                              assignTableCustomer(c.id, c.name)
                            }
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-50 border border-transparent hover:border-brand-200"
                        >
                          <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                          <p className="text-[10px] text-slate-500">{c.phone || c.email || 'Sin contacto'} · {c.points} pts</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {customers.length === 0 ? 'Sin clientes en CRM' : 'Sin resultados'}
                    </p>
                  )}
                </>
              )}
            </div>

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
                <ShoppingBag size={14} /> {selected.status === 'cobro_pendiente' ? 'POS (agregar)' : 'Ir a POS'}
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

      <Modal open={splitModal} onClose={() => setSplitModal(false)} title="División de cuenta" size="md">
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">Mesa {selected?.number} — Total {formatCurrency(splitTotal)}</p>

          <div className="flex gap-2 p-1 rounded-xl bg-slate-100">
            {(['equal', 'items'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSplitMode(mode)}
                disabled={mode === 'items' && splitOrderItems.length < 2}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-bold transition-colors',
                  splitMode === mode ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500',
                  mode === 'items' && splitOrderItems.length < 2 && 'opacity-40 cursor-not-allowed'
                )}
              >
                {mode === 'equal' ? 'Partes iguales' : 'Por ítems'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setSplitParts(n)
                  setSplitNames((prev) => {
                    const next = [...prev]
                    while (next.length < n) next.push(`Persona ${next.length + 1}`)
                    return next.slice(0, n)
                  })
                  setSplitItemAssign((prev) => {
                    const next = { ...prev }
                    for (const item of splitOrderItems) {
                      const idx = prev[item.id] ?? 0
                      if (idx >= n) next[item.id] = idx % n
                    }
                    return next
                  })
                }}
                className={cn('flex-1 py-3 rounded-xl border font-bold', splitParts === n ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-command-border')}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {Array.from({ length: splitParts }, (_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder={`Comensal ${i + 1} (ej. María)`}
                  value={splitNames[i] || ''}
                  onChange={(e) => {
                    const next = [...splitNames]
                    next[i] = e.target.value
                    setSplitNames(next)
                  }}
                  className="flex-1"
                />
                <span className="text-sm font-mono font-bold shrink-0 w-20 text-right">
                  {formatCurrency(splitPreview[i]?.amount ?? 0)}
                </span>
              </div>
            ))}
          </div>

          {splitMode === 'items' && splitOrderItems.length > 0 && (
            <div className="rounded-xl border border-command-border divide-y max-h-48 overflow-y-auto">
              {splitOrderItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="flex-1 truncate">
                    {item.quantity}× {item.product_name}
                  </span>
                  <span className="text-xs font-mono text-slate-500 shrink-0">{formatCurrency(item.subtotal)}</span>
                  <select
                    value={splitItemAssign[item.id] ?? 0}
                    onChange={(e) => setSplitItemAssign((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                    className="text-xs border border-command-border rounded-lg px-2 py-1 bg-white"
                  >
                    {Array.from({ length: splitParts }, (_, i) => (
                      <option key={i} value={i}>
                        {splitNames[i]?.trim() || `Persona ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-slate-500 leading-relaxed">
            {splitMode === 'equal'
              ? 'Cada comensal paga su parte en POS (efectivo, tarjeta o mixto). El cobro con tarjeta es solo registro.'
              : 'Asigna cada producto a un comensal. El total incluye IVA y descuentos proporcionales.'}
          </p>
          <Button className="w-full" loading={splitSaving} onClick={confirmSplit}>
            Confirmar división
          </Button>
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

      <Modal open={addAreaModal} onClose={() => setAddAreaModal(false)} title="Nueva área" size="sm">
        <div className="p-5 space-y-4">
          <Input
            label="Nombre del área"
            placeholder="Ej. Terraza, Barra, Salón VIP"
            value={areaForm.name}
            onChange={e => setAreaForm(f => ({ ...f, name: e.target.value }))}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Color</p>
            <div className="flex gap-2 flex-wrap">
              {AREA_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAreaForm(f => ({ ...f, color }))}
                  className={cn(
                    'w-9 h-9 rounded-xl border-2 transition-transform hover:scale-105',
                    areaForm.color === color ? 'border-slate-800 scale-105' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={handleCreateArea} disabled={saving || !areaForm.name.trim()}>
            {saving ? 'Guardando…' : 'Crear área'}
          </Button>
        </div>
      </Modal>

      <Modal open={addTableModal} onClose={() => setAddTableModal(false)} title="Nueva mesa" size="sm">
        <div className="p-5 space-y-4">
          <Input
            label="Número de mesa"
            type="number"
            min={1}
            value={tableForm.number}
            onChange={e => setTableForm(f => ({ ...f, number: e.target.value }))}
          />
          <Input
            label="Capacidad (personas)"
            type="number"
            min={1}
            value={tableForm.capacity}
            onChange={e => setTableForm(f => ({ ...f, capacity: e.target.value }))}
          />
          <div className="space-y-1.5">
            <label htmlFor="table-area" className="text-sm font-medium text-slate-700">Área</label>
            <select
              id="table-area"
              value={tableForm.area_id}
              onChange={e => setTableForm(f => ({ ...f, area_id: e.target.value }))}
              className="w-full h-11 rounded-xl px-3 text-sm bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              {areaList.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>
          <Button className="w-full" onClick={handleCreateTable} disabled={saving || !tableForm.number || !tableForm.area_id}>
            {saving ? 'Guardando…' : 'Crear mesa'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
