import { useEffect, useState } from 'react'
import { FileText, Plus, Stamp, XCircle, Download, FileCode } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import { invoiceRepository, CFDI_USOS } from '@/repositories/invoiceRepository'
import { orderRepository } from '@/repositories/orderRepository'
import { useTenantContext } from '@/hooks/useTenantContext'
import { toast } from '@/components/ui/Toast'
import type { Invoice } from '@/types/demo'
import type { Order } from '@/types'

const STATUS_VARIANT: Record<Invoice['status'], 'success' | 'warning' | 'danger'> = {
  timbrada: 'success',
  pendiente: 'warning',
  cancelada: 'danger',
}

export default function InvoicingPage() {
  const ctx = useTenantContext()
  const [tick, setTick] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState<Invoice | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [form, setForm] = useState({ rfc: '', razon_social: '', email: '', uso_cfdi: 'G03' })
  const [stamping, setStamping] = useState<string | null>(null)

  const refresh = () => setTick(t => t + 1)
  const invoices = invoiceRepository.getAll()
  const billable = orders.filter(o => !invoiceRepository.getByOrderId(o.id))

  useEffect(() => {
    if (!ctx) return
    orderRepository.getAllOrders(ctx).then(all =>
      setOrders(all.filter(o => o.status === 'cobrada'))
    )
  }, [ctx, tick])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return
    try {
      const inv = invoiceRepository.createFromOrder(selectedOrder, form)
      toast(`Factura ${inv.folio} creada — pendiente de timbrar`, 'success')
      setCreateOpen(false)
      setSelectedOrder(null)
      setForm({ rfc: '', razon_social: '', email: '', uso_cfdi: 'G03' })
      refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error', 'error')
    }
  }

  const handleStamp = async (id: string) => {
    setStamping(id)
    try {
      const inv = await invoiceRepository.stamp(id)
      toast(`CFDI timbrado — UUID ${inv.uuid?.slice(0, 8)}...`, 'success')
      refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al timbrar', 'error')
    } finally {
      setStamping(null)
    }
  }

  const handleCancel = () => {
    if (!cancelOpen || !cancelReason.trim()) return
    try {
      invoiceRepository.cancel(cancelOpen.id, cancelReason)
      toast('Factura cancelada ante el SAT (demo)', 'info')
      setCancelOpen(null)
      setCancelReason('')
      refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error', 'error')
    }
  }

  const downloadXml = (inv: Invoice) => {
    const xml = invoiceRepository.getXmlContent(inv)
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${inv.folio}.xml`
    a.click()
    URL.revokeObjectURL(url)
    toast('XML descargado', 'success')
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Fase 34</p>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText size={24} /> Facturación CFDI 4.0
          </h1>
          <p className="text-sm text-slate-500">Timbrado, cancelación SAT, XML y PDF — listo para PAC</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!billable.length}>
          <Plus size={16} /> Facturar venta
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-mono font-black text-ops-success">{invoices.filter(i => i.status === 'timbrada').length}</p>
          <p className="text-[10px] text-slate-500 uppercase">Timbradas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-mono font-black text-ops-warning">{invoices.filter(i => i.status === 'pendiente').length}</p>
          <p className="text-[10px] text-slate-500 uppercase">Pendientes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-mono font-black">{formatCurrency(invoices.filter(i => i.status === 'timbrada').reduce((s, i) => s + i.total, 0))}</p>
          <p className="text-[10px] text-slate-500 uppercase">Facturado</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            {['Folio', 'Orden', 'RFC', 'Receptor', 'Total', 'Estado', 'Acciones'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {invoices.map(i => (
              <tr key={i.id} className="hover:bg-brand-50/30">
                <td className="px-4 py-3 font-mono text-brand-600">{i.folio}</td>
                <td className="px-4 py-3">{i.order_folio}</td>
                <td className="px-4 py-3 font-mono text-xs">{i.rfc}</td>
                <td className="px-4 py-3 text-xs">{i.razon_social || '—'}</td>
                <td className="px-4 py-3 font-bold">{formatCurrency(i.total)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[i.status]} className="capitalize">{i.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {i.status === 'pendiente' && (
                      <Button size="sm" variant="outline" loading={stamping === i.id} onClick={() => handleStamp(i.id)}>
                        <Stamp size={12} /> Timbrar
                      </Button>
                    )}
                    {i.status === 'timbrada' && (
                      <>
                        <button onClick={() => downloadXml(i)} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-600" title="XML">
                          <FileCode size={14} />
                        </button>
                        <button onClick={() => toast(`PDF ${i.folio} generado (demo)`, 'info')} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-600" title="PDF">
                          <Download size={14} />
                        </button>
                        <button onClick={() => setCancelOpen(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-ops-danger" title="Cancelar">
                          <XCircle size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Facturar venta" size="md">
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Selecciona orden cobrada</p>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {billable.length === 0 ? (
                <p className="text-xs text-slate-500">No hay ventas pendientes de facturar — cobra en POS primero</p>
              ) : billable.map(o => (
                <button key={o.id} type="button" onClick={() => setSelectedOrder(o)}
                  className={`p-3 rounded-xl border text-left ${selectedOrder?.id === o.id ? 'border-brand-400 bg-brand-50' : 'border-command-border'}`}>
                  <span className="font-mono text-brand-600">{o.folio}</span>
                  <span className="ml-2 font-bold">{formatCurrency(o.total)}</span>
                  <span className="text-xs text-slate-500 ml-2">{new Date(o.created_at).toLocaleDateString('es-MX')}</span>
                </button>
              ))}
            </div>
          </div>
          {selectedOrder && (
            <>
              <Input label="RFC receptor" placeholder="XAXX010101000" value={form.rfc} onChange={e => setForm(f => ({ ...f, rfc: e.target.value.toUpperCase() }))} required />
              <Input label="Razón social" value={form.razon_social} onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))} required />
              <Input label="Email (envío XML/PDF)" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <div>
                <label className="text-xs font-semibold text-slate-600">Uso CFDI</label>
                <select className="w-full mt-1 border border-command-border rounded-xl px-3 py-2 text-sm"
                  value={form.uso_cfdi} onChange={e => setForm(f => ({ ...f, uso_cfdi: e.target.value }))}>
                  {CFDI_USOS.map(u => <option key={u.code} value={u.code}>{u.label}</option>)}
                </select>
              </div>
              <div className="bg-brand-50 rounded-xl p-3 text-sm">
                <p>Subtotal: {formatCurrency(selectedOrder.subtotal)}</p>
                <p>IVA: {formatCurrency(selectedOrder.tax)}</p>
                <p className="font-bold text-brand-700">Total: {formatCurrency(selectedOrder.total)}</p>
              </div>
              <Button type="submit" className="w-full">Crear factura pendiente</Button>
            </>
          )}
        </form>
      </Modal>

      <Modal open={!!cancelOpen} onClose={() => setCancelOpen(null)} title="Cancelar CFDI" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">Factura <strong>{cancelOpen?.folio}</strong> — motivo de cancelación SAT:</p>
          <Input label="Motivo" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="02 — Comprobante emitido con errores" required />
          <Button variant="danger" className="w-full" onClick={handleCancel}>Cancelar ante el SAT</Button>
        </div>
      </Modal>
    </div>
  )
}
