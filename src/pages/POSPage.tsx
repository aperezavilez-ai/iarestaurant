import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote,
  Smartphone, Sparkles, UtensilsCrossed, Tag, MessageSquare, Users, ChefHat,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { TicketModal } from '@/components/pos/TicketModal'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import { useTenantContext } from '@/hooks/useTenantContext'
import { catalogRepository } from '@/repositories/catalogRepository'
import { orderRepository } from '@/repositories/orderRepository'
import { tableRepository } from '@/repositories/tableRepository'
import { cashRepository } from '@/repositories/cashRepository'
import { usePOSStore, calcPOSTotals } from '@/store/posStore'
import { DEMO_VARIANTS } from '@/data/demoSeed'
import type { Product, RestaurantTable, Order, Payment } from '@/types'
import type { PaymentMethod } from '@/types'

const CATEGORY_ICONS: Record<string, string> = {
  Tacos: 'TC', Platillos: 'PL', Entradas: 'EN', Bebidas: 'BB', Cocteles: 'CK', Postres: 'PS',
}

const PROMO_CODES: Record<string, { percent: number; label: string }> = {
  VIP10: { percent: 10, label: '10% Clientes VIP' },
  HAPPY20: { percent: 20, label: 'Happy Hour Cocteles' },
  COMBO15: { percent: 15, label: 'Combo Familiar' },
}

export default function POSPage() {
  const ctx = useTenantContext()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [payModal, setPayModal] = useState(false)
  const [payMethod, setPayMethod] = useState<'efectivo' | 'tarjeta' | 'digital' | 'mixto'>('efectivo')
  const [cashReceived, setCashReceived] = useState('')
  const [mixedCash, setMixedCash] = useState('')
  const [mixedCard, setMixedCard] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiTip, setAiTip] = useState('')
  const [variantProduct, setVariantProduct] = useState<Product | null>(null)
  const [notesLineId, setNotesLineId] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [tableModal, setTableModal] = useState(false)
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null)
  const [ticketPayment, setTicketPayment] = useState<Payment | null>(null)
  const [ticketChange, setTicketChange] = useState(0)
  const [ticketTableLabel, setTicketTableLabel] = useState('Mostrador')
  const [cashOpen, setCashOpen] = useState(true)

  const cart = usePOSStore(s => s.cart)
  const tableId = usePOSStore(s => s.tableId)
  const tableNumber = usePOSStore(s => s.tableNumber)
  const guests = usePOSStore(s => s.guests)
  const discountPercent = usePOSStore(s => s.discountPercent)
  const discountFixed = usePOSStore(s => s.discountFixed)
  const promoCode = usePOSStore(s => s.promoCode)
  const addItem = usePOSStore(s => s.addItem)
  const updateQty = usePOSStore(s => s.updateQty)
  const updateNotes = usePOSStore(s => s.updateNotes)
  const clearCart = usePOSStore(s => s.clearCart)
  const setTable = usePOSStore(s => s.setTable)
  const setGuests = usePOSStore(s => s.setGuests)
  const setDiscount = usePOSStore(s => s.setDiscount)

  useEffect(() => {
    if (!ctx) return
    catalogRepository.getProducts(ctx).then(setProducts)
    tableRepository.getTables(ctx).then(setTables)
    cashRepository.getOpenRegister(ctx).then(r => setCashOpen(!!r))
  }, [ctx])

  useEffect(() => {
    const mesa = searchParams.get('mesa')
    if (!mesa || !tables.length) return
    const t = tables.find(tb => String(tb.number) === mesa)
    if (t) setTable(t.id, t.number)
  }, [searchParams, tables, setTable])

  useEffect(() => {
    if (cart.length === 0) { setAiTip(''); return }
    const hasFood = cart.some(c => ['Tacos', 'Platillos', 'Entradas'].includes(c.category))
    const hasDrink = cart.some(c => ['Bebidas', 'Cocteles'].includes(c.category))
    if (hasFood && !hasDrink) setAiTip('IA: 72% de clientes con este pedido agregan bebida (+$25 ticket)')
    else setAiTip('')
  }, [cart])

  const categories = ['Todos', ...Array.from(new Set(products.filter(p => p.is_active).map(p => p.category?.name || 'Sin categoría')))]
  const filtered = products.filter(p =>
    p.is_active && (category === 'Todos' || p.category?.name === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const taxRate = ctx?.taxRate ?? 0.16
  const { subtotal, discount, tax, total } = calcPOSTotals(cart, taxRate, discountPercent, discountFixed)
  const change = payMethod === 'efectivo' ? Math.max(0, Number(cashReceived) - total) : 0
  const mixedValid = payMethod !== 'mixto' || (Number(mixedCash) + Number(mixedCard) >= total - 0.01)

  const handleProductClick = (p: Product) => {
    if (p.has_variants && DEMO_VARIANTS.some(v => v.product_id === p.id)) {
      setVariantProduct(p)
      return
    }
    addItem({
      product_id: p.id,
      product_name: p.name,
      unit_price: p.price,
      category: p.category?.name || '',
    })
  }

  const applyVariant = (variantId: string) => {
    if (!variantProduct) return
    const v = DEMO_VARIANTS.find(x => x.id === variantId)
    if (!v) return
    addItem({
      product_id: variantProduct.id,
      product_name: variantProduct.name,
      unit_price: variantProduct.price + v.price_modifier,
      category: variantProduct.category?.name || '',
      variant_name: v.name,
    })
    setVariantProduct(null)
  }

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    const promo = PROMO_CODES[code]
    if (!promo) {
      toast('Código no válido — prueba VIP10, HAPPY20 o COMBO15', 'error')
      return
    }
    setDiscount(promo.percent, 0, code)
    toast(`Promoción aplicada: ${promo.label}`, 'success')
    setPromoInput('')
  }

  const cartLines = () => cart.map(c => ({
    product_id: c.product_id,
    product_name: c.product_name,
    quantity: c.quantity,
    unit_price: c.unit_price,
    notes: c.notes,
  }))

  const handlePay = async () => {
    if (!ctx || !cart.length) return
    if (!cashOpen) {
      toast('Abre la caja antes de cobrar', 'error')
      return
    }
    setLoading(true)
    try {
      const methodMap: Record<string, PaymentMethod> = {
        efectivo: 'efectivo', tarjeta: 'tarjeta', digital: 'transferencia', mixto: 'mixto',
      }
      const { order, payment } = await orderRepository.createOrderWithPayment(
        ctx, cartLines(), methodMap[payMethod],
        {
          cashReceived: Number(cashReceived),
          tableId: tableId || undefined,
          discount,
          guests,
          promoCode: promoCode || undefined,
          mixedCash: payMethod === 'mixto' ? Number(mixedCash) : undefined,
          mixedCard: payMethod === 'mixto' ? Number(mixedCard) : undefined,
        }
      )
      setTicketTableLabel(tableNumber ? `Mesa ${tableNumber}` : 'Mostrador')
      setTicketOrder(order)
      setTicketPayment(payment)
      setTicketChange(change)
      clearCart()
      setTable(null, null)
      setPayModal(false)
      setCashReceived('')
      setMixedCash('')
      setMixedCard('')
      toast(`✓ ${order.folio} — ${formatCurrency(order.total)}`, 'success')
    } catch {
      toast('Error al procesar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSendKitchen = async () => {
    if (!ctx || !cart.length) return
    setLoading(true)
    try {
      const order = await orderRepository.sendToKitchen(ctx, cartLines(), tableId || undefined)
      toast(`Comanda ${order.folio} enviada a cocina`, 'success')
      clearCart()
    } catch {
      toast('Error al enviar comanda', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveNotes = () => {
    if (notesLineId) updateNotes(notesLineId, notesText)
    setNotesLineId(null)
    setNotesText('')
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-command-bg">
      <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden border-r border-command-border">
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={15} />} className="flex-1 min-w-[200px]" />
          <button onClick={() => setTableModal(true)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold min-h-[40px]',
              tableNumber ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-command-border bg-white text-slate-600')}>
            <UtensilsCrossed size={14} />
            {tableNumber ? `Mesa ${tableNumber}` : 'Mostrador'}
          </button>
          {!cashOpen && (
            <Badge variant="danger" className="self-center">Caja cerrada</Badge>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn('px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px]',
                category === c ? 'bg-brand-100 text-brand-700 border border-brand-400 shadow-glow' : 'bg-command-elevated text-slate-600 border border-command-border hover:border-brand-300')}>
              {c}
            </button>
          ))}
        </div>

        {aiTip && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs text-ai-600">
            <Sparkles size={14} /> {aiTip}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filtered.map(p => {
              const inCart = cart.filter(i => i.product_id === p.id)
              const qty = inCart.reduce((s, i) => s + i.quantity, 0)
              const abbr = CATEGORY_ICONS[p.category?.name || ''] || '••'
              return (
                <button key={p.id} onClick={() => handleProductClick(p)}
                  className={cn('rounded-xl p-4 text-left transition-all active:scale-95 min-h-[100px]',
                    qty ? 'product-tile-active' : 'product-tile')}>
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-[10px] font-mono font-bold text-orange-600 mb-2">{abbr}</div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{p.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{p.category?.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-base font-mono font-black text-brand-600">{formatCurrency(p.price)}</p>
                    {qty > 0 && <Badge variant="amber">{qty}</Badge>}
                    {p.has_variants && <Badge variant="info" className="text-[9px]">Var</Badge>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="w-[360px] flex flex-col bg-white border-l border-command-border shrink-0 shadow-panel">
        <div className="p-4 border-b border-command-border bg-gradient-to-r from-brand-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-orange-600" />
              <span className="font-mono text-sm font-bold text-slate-800">TICKET</span>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-[10px] font-mono text-ops-danger hover:underline">LIMPIAR</button>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
            <span>{new Date().toLocaleString('es-MX')}</span>
            {tableNumber && <span className="text-brand-600 font-bold">M{tableNumber}</span>}
            <span className="flex items-center gap-1"><Users size={10} />{guests}</span>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-command-border bg-command-elevated/50 space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Código promo" value={promoInput} onChange={e => setPromoInput(e.target.value)} className="text-xs h-8" />
            <Button size="sm" variant="outline" onClick={applyPromo} className="shrink-0 h-8 px-2">
              <Tag size={12} />
            </Button>
          </div>
          {promoCode && <Badge variant="success" className="text-[10px]">{promoCode} −{discountPercent}%</Badge>}
          <div className="flex gap-2 items-center">
            <span className="text-[10px] text-slate-500">Comensales</span>
            <button onClick={() => setGuests(guests - 1)} className="w-6 h-6 rounded bg-white border text-xs">−</button>
            <span className="text-xs font-mono font-bold w-4 text-center">{guests}</span>
            <button onClick={() => setGuests(guests + 1)} className="w-6 h-6 rounded bg-white border text-xs">+</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <ShoppingCart size={32} className="mb-2 opacity-30" />
              <p className="text-xs font-mono">SIN ARTÍCULOS</p>
            </div>
          ) : cart.map(item => (
            <div key={item.lineId} className="flex items-center gap-2 p-2.5 rounded-lg bg-command-elevated border border-command-border">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{item.product_name}</p>
                <p className="text-xs font-mono text-brand-600">{formatCurrency(item.unit_price)}</p>
                {item.notes && <p className="text-[10px] text-ops-warning truncate">⚠ {item.notes}</p>}
              </div>
              <button onClick={() => { setNotesLineId(item.lineId); setNotesText(item.notes || '') }}
                className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400">
                <MessageSquare size={12} />
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.lineId, -1)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-slate-500 hover:text-ops-danger">
                  {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                </button>
                <span className="w-6 text-center text-sm font-mono font-bold">{item.quantity}</span>
                <button onClick={() => updateQty(item.lineId, 1)} className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700">
                  <Plus size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-command-border bg-brand-50/50 p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-600"><span>SUBTOTAL</span><span>{formatCurrency(subtotal)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between text-xs font-mono text-ops-success"><span>DESCUENTO</span><span>−{formatCurrency(discount)}</span></div>
          )}
          <div className="flex justify-between text-xs font-mono text-slate-600"><span>IVA {(taxRate * 100).toFixed(0)}%</span><span>{formatCurrency(tax)}</span></div>
          <div className="flex justify-between text-2xl font-mono font-black text-slate-800 pt-2 border-t border-command-border">
            <span>TOTAL</span><span className="text-brand-600">{formatCurrency(total)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button variant="outline" size="lg" disabled={!cart.length || loading} onClick={handleSendKitchen}>
              <ChefHat size={16} /> Cocina
            </Button>
            <Button size="lg" disabled={!cart.length} onClick={() => setPayModal(true)}>
              <CreditCard size={16} /> Cobrar
            </Button>
          </div>
        </div>
      </div>

      <Modal open={!!variantProduct} onClose={() => setVariantProduct(null)} title="Selecciona variante" size="sm">
        <div className="p-5 space-y-2">
          <p className="text-sm font-bold text-slate-800 mb-3">{variantProduct?.name}</p>
          {DEMO_VARIANTS.filter(v => v.product_id === variantProduct?.id).map(v => (
            <button key={v.id} onClick={() => applyVariant(v.id)}
              className="w-full flex justify-between items-center p-3 rounded-xl border border-command-border hover:border-brand-400 hover:bg-brand-50">
              <span className="font-semibold text-slate-800">{v.name}</span>
              <span className="font-mono text-brand-600">
                {formatCurrency((variantProduct?.price || 0) + v.price_modifier)}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={!!notesLineId} onClose={() => setNotesLineId(null)} title="Notas del platillo" size="sm">
        <div className="p-5 space-y-4">
          <Input label="Instrucciones especiales" placeholder="Sin cebolla, extra picante..." value={notesText} onChange={e => setNotesText(e.target.value)} />
          <Button className="w-full" onClick={saveNotes}>Guardar nota</Button>
        </div>
      </Modal>

      <Modal open={tableModal} onClose={() => setTableModal(false)} title="Asignar mesa" size="sm">
        <div className="p-5 grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          <button onClick={() => { setTable(null, null); setTableModal(false) }}
            className="col-span-4 p-3 rounded-xl border border-command-border font-bold text-sm hover:bg-brand-50">
            Mostrador (sin mesa)
          </button>
          {tables.map(t => (
            <button key={t.id} onClick={() => { setTable(t.id, t.number); setTableModal(false) }}
              className={cn('p-3 rounded-xl border font-mono font-bold text-sm min-h-[48px]',
                tableId === t.id ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-command-border hover:bg-gray-50',
                t.status === 'ocupada' && 'ring-2 ring-ops-danger/30')}>
              {t.number}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Procesar cobro" size="sm">
        <div className="p-5 space-y-4">
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 text-center">
            <p className="text-[10px] font-mono text-slate-500 uppercase">Total</p>
            <p className="text-4xl font-mono font-black text-brand-600 mt-1">{formatCurrency(total)}</p>
            {discount > 0 && <p className="text-xs text-ops-success mt-1">Descuento aplicado: −{formatCurrency(discount)}</p>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[{ id: 'efectivo', label: 'Efectivo', icon: Banknote }, { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard }, { id: 'digital', label: 'Digital', icon: Smartphone }, { id: 'mixto', label: 'Mixto', icon: Sparkles }].map(m => (
              <button key={m.id} onClick={() => setPayMethod(m.id as typeof payMethod)}
                className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all min-h-[72px]',
                  payMethod === m.id ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-command-border text-slate-500 hover:bg-gray-50')}>
                <m.icon size={18} /><span className="text-[10px] font-bold">{m.label}</span>
              </button>
            ))}
          </div>
          {payMethod === 'efectivo' && (
            <Input label="Recibido" type="number" value={cashReceived} onChange={e => setCashReceived(e.target.value)} />
          )}
          {payMethod === 'mixto' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Efectivo" type="number" value={mixedCash} onChange={e => setMixedCash(e.target.value)} />
              <Input label="Tarjeta" type="number" value={mixedCard} onChange={e => setMixedCard(e.target.value)} />
            </div>
          )}
          {payMethod === 'efectivo' && Number(cashReceived) >= total && (
            <div className="bg-ops-success/10 rounded-xl p-3 flex justify-between border border-ops-success/30">
              <span className="text-sm text-ops-success font-mono">CAMBIO</span>
              <span className="text-lg font-mono font-black text-ops-success">{formatCurrency(change)}</span>
            </div>
          )}
          <Button className="w-full" size="lg" loading={loading} onClick={handlePay}
            disabled={(payMethod === 'efectivo' && Number(cashReceived) < total) || !mixedValid}>
            Confirmar cobro
          </Button>
        </div>
      </Modal>

      <TicketModal
        open={!!ticketOrder}
        onClose={() => setTicketOrder(null)}
        order={ticketOrder}
        payment={ticketPayment}
        tableLabel={ticketTableLabel}
        change={ticketChange}
      />
    </div>
  )
}
