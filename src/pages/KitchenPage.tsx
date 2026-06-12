import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Clock, CheckCircle, Bell, Flame, QrCode, AlertTriangle } from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import { useTenantContext } from '@/hooks/useTenantContext'
import { useOpsSync } from '@/hooks/useOpsSync'
import { orderRepository } from '@/repositories/orderRepository'
import { tableRepository } from '@/repositories/tableRepository'
import { useLiveFlowStore } from '@/store/liveFlowStore'
import { KITCHEN_CENTERS, itemMatchesCenter, getProductCategory, type KitchenCenterId } from '@/lib/productionCenters'
import type { Order, OrderItem } from '@/types'

export default function KitchenPage() {
  const ctx = useTenantContext()
  const [orders, setOrders] = useState<Order[]>([])
  const [tableMap, setTableMap] = useState<Record<string, number>>({})
  const [now, setNow] = useState(Date.now())
  const [center, setCenter] = useState<KitchenCenterId>('all')

  const load = useCallback(async () => {
    if (!ctx) return
    const [active, tables] = await Promise.all([
      orderRepository.getActiveOrders(ctx),
      tableRepository.getTables(ctx),
    ])
    setOrders(active.filter(o => o.status !== 'cobrada' && o.status !== 'cancelada'))
    setTableMap(Object.fromEntries(tables.map(t => [t.id, t.number])))
  }, [ctx])

  useOpsSync(load, 3000)

  useEffect(() => {
    load()
    const t = setInterval(() => setNow(Date.now()), 10000)
    return () => clearInterval(t)
  }, [load])

  const mins = (date: string) => Math.floor((now - new Date(date).getTime()) / 60000)

  const updateQROrderStatus = useLiveFlowStore(s => s.updateQROrderStatus)
  const addWaiterAlert = useLiveFlowStore(s => s.addWaiterAlert)
  const qrOrders = useLiveFlowStore(s => s.qrOrders)

  const markItem = async (item: OrderItem, order: Order, status: OrderItem['status']) => {
    await orderRepository.updateItemStatus(item.id, status)
    if (status === 'listo') {
      const tableNum = order.table_id ? tableMap[order.table_id] : undefined
      if (tableNum) {
        await addWaiterAlert({
          type: 'pedido_listo',
          table_number: tableNum,
          order_id: order.id,
          message: `${item.product_name} listo — Mesa ${tableNum}`,
        })
      }
      toast('Platillo LISTO — mesero notificado', 'success')
    }
    await load()
  }

  const markAllReady = async (order: Order) => {
    for (const item of order.items || []) {
      if (item.status !== 'listo') await orderRepository.updateItemStatus(item.id, 'listo')
    }
    await orderRepository.updateOrderStatus(order.id, 'lista', ctx!)
    const qrOrder = qrOrders.find(o => o.kitchen_order_id === order.id)
    if (qrOrder) await updateQROrderStatus(qrOrder.id, 'listo')

    const tableNum = order.table_id ? tableMap[order.table_id] : undefined
    if (tableNum) {
      await addWaiterAlert({
        type: 'pedido_listo',
        table_number: tableNum,
        order_id: order.id,
        message: `¡Orden completa! Mesa ${tableNum} — llevar a mesa (${order.folio})`,
      })
    }
    toast('Orden completa — mesero notificado', 'success')
    await load()
  }

  const filterItems = (items: OrderItem[]) =>
    items.filter(i => itemMatchesCenter(getProductCategory(i.product_id, i.product_name), center))

  const visibleOrders = orders
    .map(o => ({ ...o, items: filterItems(o.items || []) }))
    .filter(o => center === 'all' || (o.items?.length ?? 0) > 0)

  const overdueCount = visibleOrders.filter(o => mins(o.created_at) > 10).length

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Flame size={20} className="text-orange-600" />
          <div>
            <p className="text-lg font-black text-slate-800 tracking-tight">KITCHEN DISPLAY</p>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">
              {visibleOrders.length} tickets · {overdueCount > 0 && <span className="text-ops-danger">{overdueCount} retrasados</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <Badge variant="danger" className="gap-1 animate-pulse">
              <AlertTriangle size={10} /> {overdueCount} alerta{overdueCount > 1 ? 's' : ''}
            </Badge>
          )}
          <div className="flex items-center gap-2 text-xs font-mono text-orange-600">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse-live" />
            LIVE
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
        {KITCHEN_CENTERS.map(c => (
          <button key={c.id} onClick={() => setCenter(c.id)}
            className={cn('px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[40px] border transition-all',
              center === c.id ? 'bg-brand-100 text-brand-700 border-brand-400' : 'bg-white text-slate-600 border-command-border')}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {visibleOrders.map(order => {
          const elapsed = mins(order.created_at)
          const isOverdue = elapsed > 10
          const items = order.items || []
          const allReady = items.length > 0 && items.every(i => i.status === 'listo')
          const tableLabel = order.table_id ? `MESA ${tableMap[order.table_id] || '?'}` : 'MOSTRADOR'
          const isQR = order.notes === 'Pedido QR'

          return (
            <div key={order.id} className={cn(
              'rounded-2xl border-2 overflow-hidden flex flex-col bg-white shadow-card',
              allReady ? 'border-green-300 bg-green-50/50' :
              isOverdue ? 'border-red-300 bg-red-50/30 shadow-glow-orange' :
              'border-orange-200'
            )}>
              <div className={cn('px-4 py-3 flex items-center justify-between border-b border-orange-100',
                isOverdue ? 'bg-red-50' : 'bg-gradient-to-r from-brand-50 to-orange-50')}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-black text-slate-800 tracking-tight">{tableLabel}</p>
                    {isQR && <Badge variant="amber" className="gap-1 text-[9px]"><QrCode size={10} />QR</Badge>}
                    {isOverdue && <Badge variant="danger" className="text-[9px]">RETRASO</Badge>}
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">{order.folio}</p>
                </div>
                <div className={cn('flex items-center gap-1.5 text-lg font-mono font-black', isOverdue ? 'text-ops-danger' : 'text-brand-600')}>
                  <Clock size={16} className={isOverdue ? 'animate-pulse' : ''} />
                  {elapsed}m
                </div>
              </div>

              <div className="flex-1 p-3 space-y-2">
                {items.map(item => (
                  <div key={item.id} className={cn('flex items-center gap-3 p-3 rounded-xl border',
                    item.status === 'listo' ? 'border-green-200 bg-green-50 opacity-70' :
                    item.status === 'preparando' ? 'border-brand-300 bg-brand-50' :
                    'border-gray-200 bg-command-elevated')}>
                    <div className="flex-1">
                      <p className={cn('text-base font-bold', item.status === 'listo' ? 'line-through text-slate-400' : 'text-slate-800')}>
                        {item.product_name}
                      </p>
                      <p className="text-sm font-mono text-brand-600">×{item.quantity}</p>
                      {item.notes && <p className="text-xs text-ops-warning mt-1">⚠ {item.notes}</p>}
                    </div>
                    <div className="flex gap-1">
                      {item.status === 'pendiente' && (
                        <button onClick={() => markItem(item, order, 'preparando')}
                          className="px-3 py-2 rounded-lg bg-brand-100 text-brand-700 text-xs font-black min-h-[44px] min-w-[64px] border border-brand-300">
                          GO
                        </button>
                      )}
                      {item.status === 'preparando' && (
                        <button onClick={() => markItem(item, order, 'listo')}
                          className="px-3 py-2 rounded-lg bg-green-100 text-ops-success text-xs font-black min-h-[44px] min-w-[64px] border border-green-300">
                          OK
                        </button>
                      )}
                      {item.status === 'listo' && <CheckCircle size={24} className="text-ops-success" />}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4 font-mono">Sin ítems en este centro</p>
                )}
              </div>

              {!allReady && items.length > 0 && (
                <div className="p-3 border-t border-orange-100">
                  <button onClick={() => markAllReady(order)}
                    className="w-full py-3 rounded-xl gradient-amber text-white text-sm font-black flex items-center justify-center gap-2 min-h-[48px] hover:opacity-90 shadow-glow">
                    <Bell size={16} /> COMPLETO — LLAMAR MESERO
                  </button>
                </div>
              )}
              {allReady && <div className="p-3"><Badge variant="success" className="w-full justify-center py-2">LISTO PARA SERVIR</Badge></div>}
            </div>
          )
        })}
        {visibleOrders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
            <Flame size={48} className="mb-4 opacity-30 text-orange-400" />
            <p className="font-mono text-sm">SIN ÓRDENES EN COLA</p>
          </div>
        )}
      </div>
    </div>
  )
}
