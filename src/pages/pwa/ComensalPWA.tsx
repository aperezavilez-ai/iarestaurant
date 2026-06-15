import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QrCode, ShoppingCart, Bell, CreditCard, Star, Plus, Minus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { useLiveFlowStore } from '@/store/liveFlowStore'
import { useLiveFlowSync } from '@/hooks/useLiveFlowSync'
import { useComensalManifest } from '@/hooks/useComensalManifest'
import { toast } from '@/components/ui/Toast'
import { InstallMenuBanner } from '@/components/comensal/InstallMenuBanner'
import { ComensalWelcome } from '@/components/comensal/ComensalWelcome'
import { ProductMenuCard } from '@/components/comensal/ProductMenuCard'
import { ProductAddSheet } from '@/components/comensal/ProductAddSheet'
import { publicMenuService } from '@/services/publicMenuService'
import { isSupabaseConfigured } from '@/lib/config'
import type { Category, Product } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  enviado: 'Enviado — esperando caja',
  validado: 'Validado',
  en_preparacion: 'En preparación',
  listo: '¡Listo! En camino',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
}

const LAST_MESA_KEY = 'comensal-last-mesa'

interface CartLine {
  lineId: string
  product_id: string
  name: string
  price: number
  qty: number
  notes?: string
}

type ResolvedTable = NonNullable<Awaited<ReturnType<typeof publicMenuService.resolveTableByNumber>>>

function ComensalMenuView({ mesa }: { mesa: number }) {
  const [table, setTable] = useState<ResolvedTable | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tenantName, setTenantName] = useState('IA·RESTAURANT')
  const [loading, setLoading] = useState(true)
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null)

  const [cart, setCart] = useState<CartLine[]>([])
  const [sending, setSending] = useState(false)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)

  const submitQROrder = useLiveFlowStore((s) => s.submitQROrder)
  const addWaiterAlert = useLiveFlowStore((s) => s.addWaiterAlert)
  const hydrateFromRemote = useLiveFlowStore((s) => s.hydrateFromRemote)
  const { qrOrders } = useLiveFlowSync(1500)

  const activeOrder = activeOrderId
    ? qrOrders.find((o) => o.id === activeOrderId)
    : qrOrders.find((o) => o.table_number === mesa && !['entregado', 'rechazado'].includes(o.status))

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  useEffect(() => {
    localStorage.setItem(LAST_MESA_KEY, String(mesa))
    if (isSupabaseConfigured()) hydrateFromRemote()
  }, [mesa, hydrateFromRemote])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      publicMenuService.resolveTableByNumber(mesa),
      publicMenuService.getMenu(),
      publicMenuService.getTenantName(),
    ])
      .then(([tbl, menu, name]) => {
        setTable(tbl)
        setProducts(menu.products)
        setCategories(menu.categories)
        setTenantName(name)
      })
      .finally(() => setLoading(false))
  }, [mesa])

  useEffect(() => {
    if (activeOrder && !activeOrderId) setActiveOrderId(activeOrder.id)
  }, [activeOrder, activeOrderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-command-bg">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
    )
  }

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-command-bg max-w-md mx-auto">
        <div className="text-center">
          <p className="text-slate-800 font-bold">Mesa {mesa} no encontrada</p>
          <p className="text-sm text-slate-600 mt-2">Escanea el QR correcto de tu mesa.</p>
          <a href="/comensal" className="text-brand-600 text-sm mt-4 inline-block">Volver</a>
        </div>
      </div>
    )
  }

  const addFromSheet = (product: Product, qty: number, notes: string) => {
    if (activeOrder) return
    const normNotes = notes.trim()
    setCart((c) => {
      const existing = c.find(
        (i) => i.product_id === product.id && (i.notes || '') === normNotes
      )
      if (existing) {
        return c.map((i) =>
          i.lineId === existing.lineId ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [
        ...c,
        {
          lineId: crypto.randomUUID(),
          product_id: product.id,
          name: product.name,
          price: product.price,
          qty,
          notes: normNotes || undefined,
        },
      ]
    })
  }

  const updateQty = (lineId: string, delta: number) => {
    setCart((c) =>
      c.map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    )
  }

  const qtyForProduct = (productId: string) =>
    cart.filter((c) => c.product_id === productId).reduce((s, i) => s + i.qty, 0)

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
        items: cart.map((c) => ({
          product_id: c.product_id,
          product_name: c.name,
          quantity: c.qty,
          unit_price: c.price,
          notes: c.notes,
        })),
      })
      setActiveOrderId(order.id)
      setCart([])
      toast(
        'Pedido enviado — ' + (order.status === 'en_preparacion' ? 'ya va a cocina' : 'caja lo validará'),
        'success'
      )
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

  const renderProductGrid = (items: Product[]) => (
    <div className="grid grid-cols-2 gap-2">
      {items.map((p) => (
        <ProductMenuCard
          key={p.id}
          product={p}
          qtyInCart={qtyForProduct(p.id) || undefined}
          disabled={!!activeOrder}
          onClick={() => setSheetProduct(p)}
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-command-bg max-w-md mx-auto pb-44">
      <ProductAddSheet
        product={sheetProduct}
        open={!!sheetProduct}
        onClose={() => setSheetProduct(null)}
        onAdd={(qty, notes) => sheetProduct && addFromSheet(sheetProduct, qty, notes)}
      />
      <header className="gradient-amber text-white p-4 sticky top-0 z-10 shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] opacity-80 uppercase tracking-widest">{tenantName}</p>
            <p className="font-black text-lg">Mesa {table.number} · {table.area_name}</p>
          </div>
          <QrCode size={24} />
        </div>
        <p className="text-xs opacity-80 mt-1">Mesero: {table.waiter_name}</p>
      </header>

      <InstallMenuBanner />

      {activeOrder && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-white border-2 border-brand-200 shadow-glow">
          <p className="text-[10px] font-mono text-slate-500 uppercase">Tu pedido · {activeOrder.folio}</p>
          <p className="font-bold text-slate-800 mt-1">{STATUS_LABELS[activeOrder.status] || activeOrder.status}</p>
          <div className="flex gap-1 mt-3 flex-wrap">
            {['enviado', 'en_preparacion', 'listo', 'entregado'].map((step, i) => {
              const steps = ['enviado', 'en_preparacion', 'listo', 'entregado']
              const currentIdx = steps.indexOf(
                activeOrder.status === 'validado' ? 'en_preparacion' : activeOrder.status
              )
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
          <ul className="mt-3 text-xs text-slate-600 space-y-1">
            {activeOrder.items.map((item, i) => (
              <li key={i}>
                {item.quantity}× {item.product_name}
                {item.notes && <span className="text-ops-warning block">↳ {item.notes}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-4 space-y-6">
        {categories.length > 0
          ? categories.map((cat) => {
              const items = products.filter((p) => p.category_id === cat.id)
              if (!items.length) return null
              return (
                <section key={cat.id}>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{cat.name}</h2>
                  {renderProductGrid(items)}
                </section>
              )
            })
          : renderProductGrid(products)}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-command-border p-4 shadow-panel z-20">
        {cart.length > 0 && !activeOrder && (
          <div className="mb-3 space-y-1 max-h-28 overflow-y-auto">
            {cart.map((i) => (
              <div key={i.lineId} className="flex justify-between items-start text-xs gap-2">
                <div className="min-w-0 flex-1">
                  <span>{i.name} ×{i.qty}</span>
                  {i.notes && <p className="text-ops-warning text-[10px] mt-0.5 truncate">↳ {i.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => updateQty(i.lineId, -1)}
                    className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center"
                  >
                    <Minus size={10} />
                  </button>
                  <button
                    onClick={() => updateQty(i.lineId, 1)}
                    className="w-6 h-6 rounded bg-brand-100 flex items-center justify-center"
                  >
                    <Plus size={10} />
                  </button>
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
        <button
          className="w-full mt-2 text-xs text-brand-600 flex items-center justify-center gap-1"
          onClick={() => toast('+20 puntos de lealtad', 'success')}
        >
          <Star size={12} /> Registrarme y ganar puntos
        </button>
      </div>
    </div>
  )
}

export default function ComensalPWA() {
  const [params] = useSearchParams()
  useComensalManifest()

  const mesaParam = params.get('mesa')
  const mesaNum = mesaParam ? Number(mesaParam) : NaN
  const hasValidMesa = mesaParam && !Number.isNaN(mesaNum) && mesaNum > 0

  if (!hasValidMesa) return <ComensalWelcome />

  return <ComensalMenuView mesa={mesaNum} />
}
