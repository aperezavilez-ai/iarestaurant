import { useEffect, useState } from 'react'
import { ModuleLayout } from '@/components/demo/ModuleLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { useTenantContext } from '@/hooks/useTenantContext'
import { orderRepository } from '@/repositories/orderRepository'
import { catalogRepository } from '@/repositories/catalogRepository'
import { DEMO_PROMOTIONS, DEMO_RESERVATIONS, DEMO_DELIVERIES, PRODUCTION_CENTERS } from '@/data/demoSeed'
import type { Order, Category } from '@/types'
import { DEMO_QR_SESSIONS } from '@/data/demoSeed'
import { Plus, Printer, QrCode, FileText } from 'lucide-react'
import { MenuSectionNav } from '@/components/menu/MenuSectionNav'
import { toast } from '@/components/ui/Toast'
import { invoiceRepository } from '@/repositories/invoiceRepository'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { CFDI_USOS } from '@/repositories/invoiceRepository'

export function SalesHistoryPage() {
  const ctx = useTenantContext()
  const [orders, setOrders] = useState<Order[]>([])
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null)
  const [invForm, setInvForm] = useState({ rfc: '', razon_social: '', email: '', uso_cfdi: 'G03' })

  const load = () => {
    if (!ctx) return
    orderRepository.getAllOrders(ctx).then(all => setOrders(all.filter(o => o.status === 'cobrada')))
  }

  useEffect(() => { load() }, [ctx])

  return (
    <ModuleLayout phase={1} title="Historial de ventas" description="Consulta ventas cobradas, reimprime tickets y exporta reportes."
      stats={[
        { label: 'Ventas hoy', value: String(orders.length) },
        { label: 'Total', value: formatCurrency(orders.reduce((s, o) => s + o.total, 0)) },
      ]}>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b border-command-border">
            <tr>{['Folio', 'Mesa', 'Total', 'Fecha', 'Acciones'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-command-border">
            {orders.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Realiza ventas en POS para ver historial</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-brand-50/30">
                <td className="px-4 py-3 font-mono text-brand-600">{o.folio}</td>
                <td className="px-4 py-3">{o.table_id ? `Mesa` : 'Mostrador'}</td>
                <td className="px-4 py-3 font-bold">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(o.created_at).toLocaleString('es-MX')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toast(`Reimprimiendo ticket ${o.folio}`, 'info')} className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:underline">
                    <Printer size={12} /> Reimprimir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!invoiceOrder} onClose={() => setInvoiceOrder(null)} title="Facturar venta" size="sm">
        {invoiceOrder && (
          <form onSubmit={e => {
            e.preventDefault()
            try {
              const inv = invoiceRepository.createFromOrder(invoiceOrder, invForm)
              toast(`Factura ${inv.folio} creada`, 'success')
              setInvoiceOrder(null)
              load()
            } catch (err) {
              toast(err instanceof Error ? err.message : 'Error', 'error')
            }
          }} className="p-5 space-y-3">
            <p className="text-sm font-mono text-brand-600">{invoiceOrder.folio} · {formatCurrency(invoiceOrder.total)}</p>
            <Input label="RFC" value={invForm.rfc} onChange={e => setInvForm(f => ({ ...f, rfc: e.target.value.toUpperCase() }))} required />
            <Input label="Razón social" value={invForm.razon_social} onChange={e => setInvForm(f => ({ ...f, razon_social: e.target.value }))} required />
            <select className="w-full border border-command-border rounded-xl px-3 py-2 text-sm" value={invForm.uso_cfdi} onChange={e => setInvForm(f => ({ ...f, uso_cfdi: e.target.value }))}>
              {CFDI_USOS.map(u => <option key={u.code} value={u.code}>{u.label}</option>)}
            </select>
            <Button type="submit" className="w-full">Crear factura</Button>
          </form>
        )}
      </Modal>
    </ModuleLayout>
  )
}

export function CategoriesPage() {
  const ctx = useTenantContext()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => { if (ctx) catalogRepository.getCategories(ctx).then(setCategories) }, [ctx])

  return (
    <ModuleLayout phase={1} title="Categorías del menú" description="Organiza tu catálogo por categorías con colores e iconos."
      actions={<Button size="sm"><Plus size={14} /> Nueva categoría</Button>}
      stats={[{ label: 'Categorías activas', value: String(categories.length) }]}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map(c => (
          <Card key={c.id} className="p-4">
            <div className="w-10 h-10 rounded-xl mb-3" style={{ backgroundColor: c.color + '33', border: `2px solid ${c.color}` }} />
            <p className="font-bold text-slate-800">{c.name}</p>
            <Badge variant="success" className="mt-2">Activa</Badge>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function PromotionsPage() {
  return (
    <ModuleLayout phase={0} title="Motor de promociones" description="2x1, combos, happy hour, descuentos por cliente — configurables sin código."
      stats={[{ label: 'Activas', value: String(DEMO_PROMOTIONS.filter(p => p.active).length) }]}>
      <div className="grid gap-3">
        {DEMO_PROMOTIONS.map(p => (
          <Card key={p.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">{p.name}</p>
              <p className="text-xs text-slate-500 mt-1">Tipo: {p.type} {p.schedule && `· ${p.schedule}`}</p>
            </div>
            <Badge variant={p.active ? 'success' : 'default'}>{p.active ? 'Activa' : 'Inactiva'}</Badge>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function DeliveryPage() {
  return (
    <ModuleLayout phase={14} title="Delivery y pedidos externos" description="Pedidos a domicilio, repartidores, zonas y seguimiento en tiempo real."
      stats={[
        { label: 'En camino', value: String(DEMO_DELIVERIES.filter(d => d.status === 'en_camino').length), color: 'text-orange-600' },
        { label: 'Preparando', value: String(DEMO_DELIVERIES.filter(d => d.status === 'preparando').length) },
      ]}>
      <div className="grid gap-3">
        {DEMO_DELIVERIES.map(d => (
          <Card key={d.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-slate-800">{d.customer_name}</p>
                <p className="text-xs text-slate-500 mt-1">{d.address}</p>
                {d.driver && <p className="text-xs text-brand-600 mt-1">Repartidor: {d.driver}</p>}
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">{formatCurrency(d.total)}</p>
                <Badge variant={d.status === 'entregado' ? 'success' : d.status === 'en_camino' ? 'amber' : 'warning'} className="mt-1 capitalize">{d.status.replace('_', ' ')}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function ReservationsPage() {
  return (
    <ModuleLayout phase={15} title="Reservaciones" description="Calendario, confirmaciones automáticas, lista de espera e integración WhatsApp."
      stats={[{ label: 'Hoy', value: String(DEMO_RESERVATIONS.filter(r => r.date === '2026-06-11').length) }]}>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            {['Cliente', 'Personas', 'Fecha', 'Hora', 'Mesa', 'Estado'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {DEMO_RESERVATIONS.map(r => (
              <tr key={r.id} className="hover:bg-brand-50/30">
                <td className="px-4 py-3 font-semibold">{r.customer_name}</td>
                <td className="px-4 py-3">{r.guests}</td>
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3">{r.time}</td>
                <td className="px-4 py-3">{r.table_number || '—'}</td>
                <td className="px-4 py-3"><Badge variant={r.status === 'confirmada' ? 'success' : 'warning'} className="capitalize">{r.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </ModuleLayout>
  )
}

export function ProductionPage() {
  return (
    <ModuleLayout phase={21} title="Centros de producción" description="Divide pedidos automáticamente: cocina caliente, fría, barra, cafetería y postres.">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRODUCTION_CENTERS.map(c => (
          <Card key={c.id} className="p-5" style={{ borderLeft: `4px solid ${c.color}` }}>
            <p className="font-black text-slate-800">{c.label}</p>
            <p className="text-xs text-slate-500 mt-2">Productos asignados:</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {c.products.map(p => <Badge key={p} variant="default">{p}</Badge>)}
            </div>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function PrintingPage() {
  const printers = [
    { area: 'Caja', ip: '192.168.1.10', status: 'conectada', jobs: 142 },
    { area: 'Cocina caliente', ip: '192.168.1.11', status: 'conectada', jobs: 89 },
    { area: 'Barra', ip: '192.168.1.12', status: 'conectada', jobs: 56 },
    { area: 'Postres', ip: '192.168.1.13', status: 'desconectada', jobs: 0 },
  ]
  return (
    <ModuleLayout phase={17} title="Impresión avanzada" description="Múltiples impresoras por área con reglas automáticas de impresión.">
      <div className="grid gap-3">
        {printers.map(p => (
          <Card key={p.area} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">{p.area}</p>
              <p className="text-xs font-mono text-slate-500">{p.ip} · {p.jobs} trabajos hoy</p>
            </div>
            <Badge variant={p.status === 'conectada' ? 'success' : 'danger'}>{p.status}</Badge>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function QRMenuPage() {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const demoMesas = [5, 12, 4, 10]

  return (
    <div className="space-y-5 animate-fadeUp">
      <MenuSectionNav />
    <ModuleLayout phase={8} title="Menú QR y sesiones" description="Escanea el QR → el comensal arma su pedido → Caja valida → Cocina prepara → Mesero recibe alerta."
      stats={[
        { label: 'Sesiones demo', value: String(demoMesas.length) },
        { label: 'Apps QR', value: '4' },
      ]}>
      <Card className="p-5 bg-brand-50/50 border-brand-200 mb-4">
        <p className="font-bold text-slate-800 mb-2">Flujo conectado en demo</p>
        <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
          <li>Abre <strong>/comensal?mesa=5</strong> en el celular (o pestaña)</li>
          <li>Abre <strong>/caja</strong> para validar pedidos</li>
          <li>Abre <strong>/mesero</strong> para ver alertas</li>
          <li>Abre <strong>Cocina</strong> en la app principal</li>
        </ol>
      </Card>
      <div className="grid gap-3">
        {demoMesas.map(num => {
          const url = `${origin}/comensal?mesa=${num}`
          const session = DEMO_QR_SESSIONS.find(s => s.table_number === num)
          return (
            <Card key={num} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-lg">Mesa {num}</p>
                  <p className="text-xs text-slate-500">{session?.area || 'Salón'} · Mesero Demo</p>
                  <p className="text-[10px] font-mono text-brand-600 mt-1 break-all">{url}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="w-20 h-20 bg-white border-2 border-brand-300 rounded-xl flex items-center justify-center">
                    <QrCode size={40} className="text-brand-600" />
                  </div>
                  <a href={url} target="_blank" rel="noreferrer">
                    <Button size="sm">Abrir menú QR</Button>
                  </a>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: 'Comensal', path: '/comensal?mesa=5' },
          { label: 'Caja', path: '/caja' },
          { label: 'Mesero', path: '/mesero' },
          { label: 'Cocina KDS', path: '/app/kitchen' },
        ].map(p => (
          <a key={p.path} href={p.path} target="_blank" rel="noreferrer"
            className="glass-panel rounded-xl p-4 text-center bg-white border border-command-border hover:border-brand-300 transition-all">
            <p className="text-sm font-bold text-brand-700">{p.label}</p>
            <p className="text-[10px] text-slate-500 mt-1">Abrir →</p>
          </a>
        ))}
      </div>
    </ModuleLayout>
    </div>
  )
}
