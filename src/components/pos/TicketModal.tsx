import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import type { BusinessBranding } from '@/lib/businessBranding'
import type { Order, Payment } from '@/types'
import { Printer, X } from 'lucide-react'

interface TicketModalProps {
  open: boolean
  onClose: () => void
  order: Order | null
  payment?: Payment | null
  tableLabel?: string
  change?: number
  business?: BusinessBranding
}

export function TicketModal({ open, onClose, order, payment, tableLabel, change, business }: TicketModalProps) {
  if (!order) return null

  const brand = business || {
    tenantName: 'Mi Restaurante',
    sucursalName: 'Sucursal Principal',
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal open={open} onClose={onClose} title="Ticket de venta" size="sm">
      <div className="p-5 space-y-4">
        <div id="pos-ticket" className="font-mono text-xs bg-white border border-dashed border-gray-300 rounded-xl p-4 space-y-2">
          <p className="text-center font-black text-sm">{brand.tenantName}</p>
          <p className="text-center text-slate-500">{brand.sucursalName}</p>
          {brand.address && <p className="text-center text-slate-400 text-[10px]">{brand.address}</p>}
          {(brand.rfc || brand.phone) && (
            <p className="text-center text-slate-400 text-[10px]">
              {[brand.rfc && `RFC ${brand.rfc}`, brand.phone].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
            <p>Folio: <span className="font-bold text-brand-600">{order.folio}</span></p>
            <p>Mesa: {tableLabel || 'Mostrador'}</p>
            <p>{new Date(order.created_at).toLocaleString('es-MX')}</p>
          </div>
          <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
            {(order.items || []).map(item => (
              <div key={item.id} className="flex justify-between gap-2">
                <span className="flex-1 truncate">{item.quantity}× {item.product_name}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-ops-success"><span>Descuento</span><span>-{formatCurrency(order.discount)}</span></div>
            )}
            <div className="flex justify-between"><span>IVA</span><span>{formatCurrency(order.tax)}</span></div>
            <div className="flex justify-between font-black text-base"><span>TOTAL</span><span>{formatCurrency(order.total)}</span></div>
          </div>
          {payment && (
            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
              <p>Pago: {payment.method.toUpperCase()}</p>
              {change != null && change > 0 && (
                <p className="text-ops-success font-bold">Cambio: {formatCurrency(change)}</p>
              )}
            </div>
          )}
          <p className="text-center text-[10px] text-slate-400 pt-2">¡Gracias por su visita!</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer size={16} /> Imprimir
          </Button>
          <Button className="flex-1" onClick={onClose}>
            <X size={16} /> Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
