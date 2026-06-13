import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QrCode, ShoppingCart, Bell, CreditCard, Star, Plus, Minus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, cn } from '@/lib/utils'
import { SEED_PRODUCTS } from '@/data/seed'
import { getTableByNumber } from '@/lib/tableLookup'
import { useLiveFlowStore } from '@/store/liveFlowStore'
import { useLiveFlowSync } from '@/hooks/useLiveFlowSync'
import { PwaBackLink } from '@/components/layout/PageBack'
import { toast } from '@/components/ui/Toast'

const STATUS_LABELS: Record<string, string> = {
  enviado: 'Enviado — esperando caja',
  validado: 'Validado',
  en_preparacion: 'En preparación',
  listo: '¡Listo! En camino',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
}

export default function ComensalPWA() {
  const [params] = useSearchParams()
  const mesa = Number(params.get('mesa') || '5')
  const table = getTableByNumber(mesa)

  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([])
  const [sending, setSending] = useState(false)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)

  const submitQROrder = useLiveFlowStore(s => s.submitQROrder)
  const addWaiterAlert = useLiveFlowStore(s => s.addWaiterAlert)
  const { qrOrders } = useLiveFlowSync(1500)

  const activeOrder = activeOrderId
    ? qrOrders.find(o => o.id === activeOrderId)
    : qrOrders.find(o => o.table_number === mesa && !['entregado', 'rechazado'].includes(o.status))

  const products = SEED_PRODUCTS.filter(p => p.is_active)
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  useEffect(() => {
    if (activeOrder && !activeOrderId) setActiveOrderId(activeOrder.id)
  }, [activeOrder, activeOrderId])

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-command-bg">
        <p className="text-slate-600">Mesa {mesa} no encontrada. Escanea un QR válido.</p>
      </div>
    )
  }

  const add = (p: typeof products[0]) => {
    if (activeOrder) return
    setCart(c => {
      const ex = c.find(i => i.id === p.id)
      if (ex) return c.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...c, { id: p.id, name: p.name, price: p.price, qty: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(c => c.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0))
  }

  const sendOrder = async () => {
    if (!cart.length || activeOrder) return
    setSending(true)
    try {
      const order = await submitQROrder({
        table_id: table.id,
        table_number: table.number,
        area: table.area_name,
        waiter_id: table.waiter_id,
        waiter_name: table.waiter_name,
        items: cart.map(c => ({
          product_id: c.id,
          product_name: c.name,
          quantity: c.qty,
          unit_price: c.price,
        })),
      })
      setActiveOrderId(order.id)
      setCart([])
      toast('Pedido enviado — ' + (order.status === 'en_preparacion' ? 'ya va a cocina' : 'caja lo validará'), 'success')
    } finally {
      setSending(false)
    }
  }

  const callWaiter = (type: 'ayuda' | 'cuenta' | 'servicio') => {
    const msgs = { ayuda: 'Necesito ayuda', cuenta: 'Quiero pagar la cuenta', servicio: 'Solicito servicio' }
    addWaiterAlert({
      type: type === 'cuenta' ? 'solicitud_cuenta' : type === 'ayuda' ? 'solicitud_ayuda' : 'solicitud_servicio',
      table_number: mesa,
      message: `Mesa ${mesa}: ${msgs[type]}`,
    })
    toast('Mesero notificado', 'success')
  }

  return (
    <div className="min-h-screen bg-command-bg max-w-md mx-auto pb-44">
      <header className="gradient-amber text-white p-4 sticky top-0 z-10 shadow-glow">
        <PwaBackLink light className="mb-2" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] opacity-80 uppercase tracking-widest">PWA Comensal · QR</p>
            <p className="font-black text-lg">Mesa {table.number} · {table.area_name}</p>
          </div>
          <QrCode size={24} />
        </div>
        <p className="text-xs opacity-80 mt-1">Mesero: {table.waiter_name}</p>
      </header>

      {activeOrder && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-white border-2 border-brand-200 shadow-glow">
          <p className="text-[10px] font-mono text-slate-500 uppercase">Tu pedido · {activeOrder.folio}</p>
          <p className="font-bold text-slate-800 mt-1">{STATUS_LABELS[activeOrder.status] || activeOrder.status}</p>
          <div className="flex gap-1 mt-3 flex-wrap">
            {['enviado', 'en_preparacion', 'listo', 'entregado'].map((step, i) => {
              const steps = ['enviado', 'en_preparacion', 'listo', 'entregado']
              const currentIdx = steps.indexOf(activeOrder.status === 'validado' ? 'en_preparacion' : activeOrder.status)
              const done = i <= currentIdx
              return (
                <Badge key={step} variant={done ? 'success' : 'default'} className="text-[9px]">
                  {['Enviado', 'Cocina', 'Listo', 'Entregado'][i]}
                </Badge>
              )
            })}
          </div>
          {activeOrder.status === 'rechazado' && (
            <p className="text-xs text-ops-danger mt-2">{activeOrder.rejected_reason}</p>
          )}
        </div>
      )}

      <div className="p-4 grid grid-cols-2 gap-2">
        {products.map(p => (
          <button key={p.id} onClick={() => add(p)} disabled={!!activeOrder}
            className={cn('product-tile rounded-xl p-3 text-left', activeOrder && 'opacity-50')}>
            <p className="text-sm font-bold text-slate-800 leading-tight">{p.name}</p>
            <p className="text-brand-600 font-mono font-bold text-sm mt-2">{formatCurrency(p.price)}</p>
            {cart.find(c => c.id === p.id) && (
              <Badge variant="amber" className="mt-2">{cart.find(c => c.id === p.id)!.qty}</Badge>
            )}
          </button>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-command-border p-4 shadow-panel z-20">
        {cart.length > 0 && !activeOrder && (
          <div className="mb-3 space-y-1 max-h-20 overflow-y-auto">
            {cart.map(i => (
              <div key={i.id} className="flex justify-between items-center text-xs">
                <span>{i.name} ×{i.qty}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(i.id, -1)} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center"><Minus size={10} /></button>
                  <button onClick={() => updateQty(i.id, 1)} className="w-6 h-6 rounded bg-brand-100 flex items-center justify-center"><Plus size={10} /></button>
                  <span className="font-mono w-14 text-right">{formatCurrency(i.price * i.qty)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => callWaiter('ayuda')}>
            <Bell size={14} /> Mesero
          </Button>
          {!activeOrder ? (
            <Button size="sm" className="flex-1" disabled={!cart.length || sending} onClick={sendOrder}>
              {sending ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
              {total > 0 ? ` Enviar ${formatCurrency(total)}` : ' Pedir'}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => callWaiter('cuenta')}>
              <CreditCard size={14} /> Pedir cuenta
            </Button>
          )}
        </div>
        <button className="w-full mt-2 text-xs text-brand-600 flex items-center justify-center gap-1" onClick={() => toast('+20 puntos de lealtad', 'success')}>
          <Star size={12} /> Registrarme y ganar puntos
        </button>
      </div>
    </div>
  )
}
