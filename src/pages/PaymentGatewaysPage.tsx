import { Link } from 'react-router-dom'
import { CreditCard, Info, Shield, ArrowLeft } from 'lucide-react'
import { PaymentGatewayCard } from '@/components/payments/PaymentGatewayCard'
import { PAYMENT_GATEWAYS, SAAS_BILLING_NOTE } from '@/data/paymentGateways'
import { usePaymentGatewayStore } from '@/store/paymentGatewayStore'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/components/ui/Toast'
import type { PaymentGatewayId } from '@/data/paymentGateways'

export default function PaymentGatewaysPage() {
  const tenant = useAuthStore((s) => s.tenant)
  const tenantId = tenant?.id || ''
  const preferred = usePaymentGatewayStore((s) => s.getPreferred(tenantId))
  const setPreferred = usePaymentGatewayStore((s) => s.setPreferred)

  const handleSelect = (id: PaymentGatewayId) => {
    if (!tenantId) return
    const next = preferred === id ? null : id
    setPreferred(tenantId, next)
    const name = PAYMENT_GATEWAYS.find((g) => g.id === id)?.name
    toast(
      next ? `${name} marcado como pasarela para cobros en restaurante` : 'Preferencia de pasarela quitada',
      'success',
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link
          to="/app/cash"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600 mb-3"
        >
          <ArrowLeft size={14} /> Volver a Caja
        </Link>
        <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Finanzas</p>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <CreditCard size={24} /> Pasarelas de pago
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Elige cómo tus comensales te pagan — cuenta y dinero van directo a ti
        </p>
      </div>

      <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-r from-brand-50 to-orange-50 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-brand-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">Cobros de tu restaurante (comensales → tú)</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              IA·RESTAURANT <strong>no procesa ni retiene</strong> el dinero de tus ventas. Al crear cuenta en
              Mercado Pago, Clip o Stripe, los pagos se depositan en <strong>tu cuenta</strong> con el proveedor que elijas.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 pt-2 border-t border-brand-200/80">
          <Shield size={18} className="text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Suscripción IA·RESTAURANT:</strong> {SAAS_BILLING_NOTE}{' '}
            <Link to="/app/subscriptions" className="text-brand-600 font-semibold hover:underline">
              Ver planes y facturación del software
            </Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PAYMENT_GATEWAYS.map((gw) => (
          <PaymentGatewayCard
            key={gw.id}
            gateway={gw}
            selected={preferred === gw.id}
            onSelect={() => handleSelect(gw.id)}
          />
        ))}
      </div>

      <p className="text-center text-[10px] text-slate-400 font-mono pb-4">
        Próximamente: conectar API keys de tu cuenta para links de pago desde POS y menú comensal
      </p>
    </div>
  )
}
