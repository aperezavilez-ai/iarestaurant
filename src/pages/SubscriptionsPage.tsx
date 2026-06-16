import { Link } from 'react-router-dom'
import { CreditCard, ExternalLink, ArrowLeft, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { SAAS_PLANS } from '@/data/saasPlans'
import { SAAS_STRIPE_NOTE } from '@/data/paymentGateways'
import { formatCurrency } from '@/lib/utils'

const STRIPE_BILLING_URL = (import.meta.env.VITE_STRIPE_BILLING_URL as string | undefined)?.trim() || ''

export default function SubscriptionsPage() {
  const tenant = useAuthStore((s) => s.tenant)
  const currentPlan = tenant?.plan || 'profesional'
  const planDef = SAAS_PLANS.find((p) => p.id === currentPlan) || SAAS_PLANS[1]

  return (
    <div className="max-w-5xl space-y-6 animate-fadeUp">
      <div>
        <Link to="/app/settings" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600 mb-3">
          <ArrowLeft size={14} /> Volver a configuración
        </Link>
        <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Empresa</p>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <CreditCard size={24} /> Suscripción IA·RESTAURANT
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Plan del software para dueños de negocio — cobro con Stripe a la plataforma
        </p>
      </div>

      <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-brand-50 p-5">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-violet-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">Stripe para tu plan IA·RESTAURANT</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{SAAS_STRIPE_NOTE}</p>
            <p className="text-xs text-slate-500 mt-2">
              Para cobrar a <strong>comensales</strong> en tu restaurante, usa{' '}
              <Link to="/app/payment-gateways" className="text-brand-600 font-semibold hover:underline">
                Pasarelas de pago
              </Link>
              {' '}(Mercado Pago, Stripe de tu negocio o Clip).
            </p>
          </div>
        </div>
      </div>

      <Card className="p-5 border-brand-200 bg-brand-50/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Plan actual</p>
            <p className="text-xl font-black text-slate-800 capitalize">{planDef.label}</p>
            <p className="text-sm text-slate-600 mt-1">
              {formatCurrency(planDef.priceMxn)}/{planDef.period} · {tenant?.name}
            </p>
          </div>
          {STRIPE_BILLING_URL ? (
            <a href={STRIPE_BILLING_URL} target="_blank" rel="noopener noreferrer">
              <Button>
                <ExternalLink size={14} /> Administrar en Stripe
              </Button>
            </a>
          ) : (
            <p className="text-xs text-slate-500 max-w-xs">
              Portal de facturación Stripe próximamente. Contacta soporte para cambiar de plan.
            </p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAAS_PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`p-5 flex flex-col ${currentPlan === plan.id ? 'border-2 border-brand-400 shadow-glow' : ''}`}
          >
            {currentPlan === plan.id && <Badge variant="amber" className="mb-3 w-fit">Plan actual</Badge>}
            <p className="font-black text-slate-800 text-lg">{plan.label}</p>
            <p className="text-2xl font-mono font-black text-brand-600 mt-1">
              {formatCurrency(plan.priceMxn)}
              <span className="text-sm text-slate-500 font-normal">/{plan.period}</span>
            </p>
            <ul className="mt-4 space-y-1.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="text-xs text-slate-600">✓ {f}</li>
              ))}
            </ul>
            <p className="text-[10px] text-slate-400 mt-4 font-mono">
              Hasta {plan.maxUsers} usuarios · {plan.maxBranches} sucursal(es) · {plan.maxTables} mesas
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
