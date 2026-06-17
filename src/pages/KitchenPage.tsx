import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Clock, CheckCircle, Bell, Flame, QrCode, AlertTriangle, ShoppingBag } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import { useTenantContext } from '@/hooks/useTenantContext'
import { useOpsSync } from '@/hooks/useOpsSync'
import { realtimeService } from '@/services/realtimeService'
import { isSupabaseConfigured } from '@/lib/config'
import { orderRepository } from '@/repositories/orderRepository'
import { tableRepository } from '@/repositories/tableRepository'
import { catalogRepository } from '@/repositories/catalogRepository'
import { useLiveFlowStore } from '@/store/liveFlowStore'
import { KITCHEN_CENTERS, itemMatchesCenter, getProductCategory, type KitchenCenterId } from '@/lib/productionCenters'
import { whatsappService } from '@/services/whatsappService'
import { emailService } from '@/services/emailService'
import { getProductImageUrl } from '@/lib/productImages'
import { formatCurrency } from '@/lib/utils'
import type { Order, OrderItem, Product, RestaurantTable, PaymentMethod } from '@/types'
import type { TenantContext } from '@/types/context'

async function notifyOrderReady(ctx: TenantContext, title: string, message: string) {
  try {
    const result = await whatsappService.sendAlert(ctx, {
      type: 'order_ready',
      title,
      message,
    })
    if (result.status === 'enviada') {
      toast('WhatsApp enviado al equipo', 'success')
    } else if (result.wa_url) {
      whatsappService.openWhatsAppLink(result.wa_url)
      toast('Abre WhatsApp para avisar al equipo', 'success')
    }
  } catch {
    /* alerta opcional */
  }
  void emailService.sendAlert(ctx, {
    type: 'order_ready',
    title,
    message,
  }).catch(() => {})
}

export default function KitchenPage() {
  const ctx = useTenantContext()
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [tableMap, setTableMap] = useState<Record<string, number>>({})
  const [now, setNow] = useState(Date.now())
  const [center, setCenter] = useState<KitchenCenterId>('all')
  const [productKitchenMap, setProductKitchenMap] = useState<Record<string, string>>({})
  const [souvenirProducts, setSouvenirProducts] = useState<Product[]>([])
  const [souvenirProduct, setSouvenirProduct] = useState<Product | null>(null)
  const [souvenirMode, setSouvenirMode] = useState<'direct' | 'account'>('direct')
  const [souvenirQty, setSouvenirQty] = useState('1')
  const [souvenirTableId, setSouvenirTableId] = useState('')
  const [souvenirPayMethod, setSouvenirPayMethod] = useState<PaymentMethod>('efectivo')
  const [souvenirCashReceived, setSouvenirCashReceived] = useState('')
  const [savingSouvenir, setSavingSouvenir] = useState(false)

  const load = useCallback(async () => {
    if (!ctx) return
    await catalogRepository.ensureSouvenirsCatalog(ctx)
    const [active, tables, products] = await Promise.all([
      orderRepository.getActiveOrders(ctx),
      tableRepository.getTables(ctx),
      catalogRepository.getProducts(ctx),
    ])
    setOrders(active.filter(o => o.status !== 'cobrada' && o.status !== 'cancelada'))
    setTables(tables)
    setTableMap(Object.fromEntries(tables.map(t => [t.id, t.number])))
    const map: Record<string, string> = {}
    for (const p of products) {
      if (p.category?.kitchen_center) map[p.id] = p.category.kitchen_center
    }
    setProductKitchenMap(map)
    setSouvenirProducts(
      products.filter(p =>
        p.is_active && (
          p.category?.kitchen_center === 'souvenirs' ||
          p.category?.name?.toLowerCase() === 'souvenirs'
        ),
      ),
    )
  }, [ctx])

  useOpsSync(load, 3000)

  useEffect(() => {
    if (!ctx || !isSupabaseConfigured()) return
    const unsub = realtimeService.subscribeTenant(ctx.tenantId, 'orders', () => load())
    return unsub
  }, [ctx, load])

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
      if (ctx && tableNum) {
        void notifyOrderReady(ctx, 'Platillo listo', `${item.product_name} listo — Mesa ${tableNum}`)
      }
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
    if (ctx) {
      const msg = tableNum
        ? `¡Orden completa! Mesa ${tableNum} — llevar a mesa (${order.folio})`
        : `¡Orden ${order.folio} lista para entregar`
      void notifyOrderReady(ctx, 'Orden lista', msg)
    }
    await load()
  }

  const filterItems = (items: OrderItem[]) =>
    items.filter(i => itemMatchesCenter(
      productKitchenMap[i.product_id],
      getProductCategory(i.product_id, i.product_name),
      center
    ))

  const visibleOrders = orders
    .map(o => ({ ...o, items: filterItems(o.items || []) }))
    .filter(o => center === 'all' || (o.items?.length ?? 0) > 0)

  const overdueCount = visibleOrders.filter(o => mins(o.created_at) > 10).length
  const souvenirTables = tables
    .filter((t) => t.status === 'ocupada' || t.status === 'cobro_pendiente')
    .sort((a, b) => a.number - b.number)

  const openSouvenirAction = (product: Product, mode: 'direct' | 'account') => {
    setSouvenirProduct(product)
    setSouvenirMode(mode)
    setSouvenirQty('1')
    setSouvenirTableId(souvenirTables[0]?.id || '')
    setSouvenirPayMethod('efectivo')
    setSouvenirCashReceived('')
  }

  const saveSouvenirSale = async () => {
    if (!ctx || !souvenirProduct) return
    const qty = Math.max(1, Number(souvenirQty || '1'))
    if (!Number.isFinite(qty) || qty < 1) {
      toast('Cantidad inválida', 'error')
      return
    }
    const line = {
      product_id: souvenirProduct.id,
      product_name: souvenirProduct.name,
      quantity: qty,
      unit_price: souvenirProduct.price,
      notes: 'Souvenir',
    }
    setSavingSouvenir(true)
    try {
      if (souvenirMode === 'account') {
        if (!souvenirTableId) {
          toast('Selecciona una mesa para añadir a la cuenta', 'error')
          return
        }
        const updated = await orderRepository.addItemsToTableAccount(ctx, souvenirTableId, [line])
        toast(`Souvenir agregado a mesa ${tableMap[souvenirTableId] || '?'} · ${updated.folio}`, 'success')
      } else {
        const opts = souvenirPayMethod === 'efectivo'
          ? { cashReceived: Number(souvenirCashReceived || souvenirProduct.price * qty) }
          : undefined
        const result = await orderRepository.createOrderWithPayment(ctx, [line], souvenirPayMethod, opts)
        toast(`Cobro directo registrado · ${result.order.folio}`, 'success')
      }
      setSouvenirProduct(null)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo registrar el souvenir', 'error')
    } finally {
      setSavingSouvenir(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-3">
      <Modal
        open={!!souvenirProduct}
        onClose={() => !savingSouvenir && setSouvenirProduct(null)}
        title="Souvenir en caja"
        size="sm"
      >
        {souvenirProduct && (
          <div className="p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-800">{souvenirProduct.name}</p>
            <p className="text-xs text-slate-500">Precio unitario: {formatCurrency(souvenirProduct.price)}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={souvenirMode === 'direct' ? 'primary' : 'outline'}
                onClick={() => setSouvenirMode('direct')}
              >
                Pago directo
              </Button>
              <Button
                size="sm"
                variant={souvenirMode === 'account' ? 'primary' : 'outline'}
                onClick={() => setSouvenirMode('account')}
              >
                Añadir a cuenta
              </Button>
            </div>

            <Input
              label="Cantidad"
              type="number"
              min={1}
              value={souvenirQty}
              onChange={(e) => setSouvenirQty(e.target.value)}
            />

            {souvenirMode === 'account' ? (
              <label className="text-sm block">
                <span className="text-slate-600 text-xs">Mesa</span>
                <select
                  className="w-full mt-1 border border-command-border rounded-xl px-3 py-2 text-sm"
                  value={souvenirTableId}
                  onChange={(e) => setSouvenirTableId(e.target.value)}
                >
                  {souvenirTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Mesa {t.number} · {t.status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label className="text-sm block">
                  <span className="text-slate-600 text-xs">Método de pago</span>
                  <select
                    className="w-full mt-1 border border-command-border rounded-xl px-3 py-2 text-sm"
                    value={souvenirPayMethod}
                    onChange={(e) => setSouvenirPayMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </label>
                {souvenirPayMethod === 'efectivo' && (
                  <Input
                    label="Recibido"
                    type="number"
                    min={0}
                    step="0.01"
                    value={souvenirCashReceived}
                    onChange={(e) => setSouvenirCashReceived(e.target.value)}
                    placeholder={String((souvenirProduct.price * Number(souvenirQty || '1')).toFixed(2))}
                  />
                )}
              </>
            )}

            <Button className="w-full" loading={savingSouvenir} onClick={saveSouvenirSale}>
              Confirmar {souvenirMode === 'direct' ? 'cobro directo' : 'añadir a cuenta'}
            </Button>
          </div>
        )}
      </Modal>

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
            className={cn('px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[44px] border transition-all',
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
        {visibleOrders.length === 0 && center === 'souvenirs' && souvenirProducts.length > 0 ? (
          <div className="col-span-full space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-black text-slate-800 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-brand-600" /> Souvenirs en venta
                </p>
                <p className="text-xs text-slate-500 mt-1">Artículos con logo del restaurante · cobra desde POS</p>
              </div>
              <p className="text-[10px] font-mono text-slate-400 uppercase">Sin pedidos en cola</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {souvenirProducts.map(p => (
                <div key={p.id} className="rounded-2xl border border-command-border bg-white overflow-hidden shadow-card">
                  <div className="aspect-square bg-slate-100">
                    <img
                      src={getProductImageUrl(p)}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{p.name}</p>
                    <p className="text-sm font-mono font-black text-brand-600 mt-1">{formatCurrency(p.price)}</p>
                    <div className="mt-2 flex gap-1.5">
                      <Button size="sm" className="flex-1" onClick={() => openSouvenirAction(p, 'direct')}>
                        Pagar directo
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openSouvenirAction(p, 'account')}>
                        A cuenta
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : visibleOrders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
            <Flame size={48} className="mb-4 opacity-30 text-orange-400" />
            <p className="font-mono text-sm">SIN ÓRDENES EN COLA</p>
          </div>
        )}
      </div>
    </div>
  )
}
