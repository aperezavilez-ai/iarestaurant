import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CreditCard, ExternalLink, ArrowLeft, Shield, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { SAAS_PLANS } from '@/data/saasPlans'
import { SAAS_STRIPE_NOTE } from '@/data/paymentGateways'
import { formatCurrency, cn } from '@/lib/utils'
import { subscriptionService } from '@/services/subscriptionService'
import { tenantService } from '@/services/tenantService'
import { toast } from '@/components/ui/Toast'

const STATUS_LABEL: Record<string, string> = {
  none: 'Sin suscripción Stripe',
  trialing: 'Periodo de prueba',
  active: 'Activa',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  incomplete: 'Incompleta',
  unpaid: 'Impaga',
}

export default function SubscriptionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tenant = useAuthStore((s) => s.tenant)
  const setTenant = useAuthStore((s) => s.setTenant)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const currentPlan = tenant?.plan || 'profesional'
  const planDef = SAAS_PLANS.find((p) => p.id === currentPlan) || SAAS_PLANS[1]
  const subStatus = tenant?.subscription_status || 'none'
  const hasStripeCustomer = Boolean(tenant?.stripe_customer_id)

  useEffect(() => {
    const stripeResult = searchParams.get('stripe')
    if (!stripeResult) return
    setSearchParams({}, { replace: true })
    if (stripeResult === 'success') {
      toast('Pago recibido — actualizando tu plan…', 'success')
      if (tenant?.id) {
        tenantService.getTenant(tenant.id).then((t) => {
          if (t) setTenant(t)
        })
      }
    } else if (stripeResult === 'cancel') {
      toast('Pago cancelado', 'error')
    }
  }, [searchParams, setSearchParams, tenant?.id, setTenant])

  const goCheckout = async (planId: typeof currentPlan) => {
    setLoadingPlan(planId)
    try {
      const url = await subscriptionService.startCheckout(planId)
      window.location.href = url
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo iniciar el pago', 'error')
      setLoadingPlan(null)
    }
  }

  const goPortal = async () => {
    setPortalLoading(true)
    try {
      const url = await subscriptionService.openBillingPortal()
      window.location.href = url
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo abrir el portal', 'error')
      setPortalLoading(false)
    }
  }

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
            <Badge
              variant={subStatus === 'active' || subStatus === 'trialing' ? 'success' : 'default'}
              className="mt-2"
            >
              {STATUS_LABEL[subStatus] || subStatus}
            </Badge>
          </div>
          <Button onClick={goPortal} loading={portalLoading} disabled={portalLoading}>
            <ExternalLink size={14} /> Administrar en Stripe
          </Button>
        </div>
        {!hasStripeCustomer && subStatus === 'none' && (
          <p className="text-xs text-slate-500 mt-3">
            Elige un plan abajo para pagar con tarjeta. Stripe te dará factura y podrás cambiar plan desde el portal.
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAAS_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const isLoading = loadingPlan === plan.id
          return (
            <Card
              key={plan.id}
              className={cn('p-5 flex flex-col', isCurrent && 'border-2 border-brand-400 shadow-glow')}
            >
              {isCurrent && <Badge variant="amber" className="mb-3 w-fit">Plan actual</Badge>}
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
              <Button
                className="w-full mt-4"
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={isCurrent || isLoading || loadingPlan !== null}
                onClick={() => goCheckout(plan.id)}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Redirigiendo a Stripe…
                  </>
                ) : isCurrent ? (
                  'Plan activo'
                ) : (
                  <>
                    <CreditCard size={14} /> {hasStripeCustomer ? 'Cambiar a este plan' : 'Pagar con Stripe'}
                  </>
                )}
              </Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
