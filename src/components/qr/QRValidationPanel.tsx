import { useLiveFlowSync } from '@/hooks/useLiveFlowSync'
import { useLiveFlowStore } from '@/store/liveFlowStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import { QrCode, Check, X } from 'lucide-react'

export function QRValidationPanel() {
  const { pending, validationMode } = useLiveFlowSync(1500)
  const validateQROrder = useLiveFlowStore(s => s.validateQROrder)
  const rejectQROrder = useLiveFlowStore(s => s.rejectQROrder)

  const handleValidate = async (id: string) => {
    await validateQROrder(id)
    toast('Pedido QR validado — enviado a cocina', 'success')
  }

  const handleReject = (id: string) => {
    rejectQROrder(id, 'Rechazado por caja')
    toast('Pedido QR rechazado', 'warning')
  }

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <div className="p-5 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode size={18} className="text-orange-600" />
          <div>
            <h3 className="font-bold text-slate-800">Validación pedidos QR</h3>
            <p className="text-xs text-slate-500">
              Modo: <span className="font-semibold text-brand-600">{validationMode === 'automatico' ? 'Automático' : 'Caja valida'}</span>
            </p>
          </div>
        </div>
        {pending.length > 0 && (
          <Badge variant="danger" className="animate-pulse-live">{pending.length} pendientes</Badge>
        )}
      </div>
      <div className="p-5 space-y-3">
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Sin pedidos QR esperando validación</p>
        ) : pending.map(order => (
          <div key={order.id} className="bg-white rounded-xl border border-orange-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-black text-slate-800">Mesa {order.table_number} · {order.area}</p>
                <p className="text-xs font-mono text-brand-600">{order.folio}</p>
                <p className="text-xs text-slate-500 mt-1">Mesero: {order.waiter_name}</p>
              </div>
              <p className="font-mono font-black text-lg text-brand-600">{formatCurrency(order.total)}</p>
            </div>
            <ul className="text-xs text-slate-600 space-y-1 mb-3">
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.quantity}× {item.product_name} — {formatCurrency(item.unit_price * item.quantity)}
                  {item.notes && <span className="text-ops-warning block">↳ {item.notes}</span>}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => handleValidate(order.id)}>
                <Check size={14} /> Aprobar → Cocina
              </Button>
              <Button size="sm" variant="danger" className="flex-1" onClick={() => handleReject(order.id)}>
                <X size={14} /> Rechazar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
