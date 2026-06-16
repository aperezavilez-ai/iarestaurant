import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CreditCard, Info, Shield, ArrowLeft, Key, Save, ExternalLink, Link2 } from 'lucide-react'
import { PaymentGatewayCard } from '@/components/payments/PaymentGatewayCard'
import {
  PAYMENT_GATEWAYS,
  SAAS_BILLING_NOTE,
  SAAS_STRIPE_NOTE,
  PAYMENT_BRIDGE_NOTE,
  PAYMENT_LINK_ONLY_NOTE,
  CONNECT_STEPS,
} from '@/data/paymentGateways'
import { usePaymentGatewayStore } from '@/store/paymentGatewayStore'
import { useAuthStore } from '@/store/authStore'
import { useTenantContext } from '@/hooks/useTenantContext'
import { tenantRepository } from '@/repositories/tenantRepository'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import type { PaymentGatewayId } from '@/data/paymentGateways'
import type { PaymentConfig } from '@/types'

const VALID_GATEWAYS = new Set<PaymentGatewayId>(['mercadopago', 'stripe', 'clip'])

export default function PaymentGatewaysPage() {
  const [searchParams] = useSearchParams()
  const highlightGw = searchParams.get('gw')
  const ctx = useTenantContext()
  const tenant = useAuthStore((s) => s.tenant)
  const tenantId = tenant?.id || ''
  const preferred = usePaymentGatewayStore((s) => s.getPreferred(tenantId))
  const setPreferred = usePaymentGatewayStore((s) => s.setPreferred)

  const [config, setConfig] = useState<PaymentConfig>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ctx) return
    tenantRepository.getPaymentConfig(ctx).then((c) => {
      const gateway = c.gateway && VALID_GATEWAYS.has(c.gateway) ? c.gateway : undefined
      const normalized = { ...c, gateway }
      setConfig(normalized)
      if (gateway) setPreferred(tenantId, gateway)
      setLoading(false)
    })
  }, [ctx, tenantId, setPreferred])

  const handleSelect = (id: PaymentGatewayId) => {
    if (!tenantId) return
    const next = preferred === id ? null : id
    setPreferred(tenantId, next)
    setConfig((c) => ({ ...c, gateway: next || undefined }))
    const gw = PAYMENT_GATEWAYS.find((g) => g.id === id)
    toast(
      next
        ? `${gw?.name} conectado${gw?.supportsPaymentLinks ? ' — pega credenciales para links' : ' — usa terminal o app Clip'}`
        : 'Pasarela desconectada',
      'success',
    )
  }

  const handleSaveCredentials = async () => {
    if (!ctx || !config.gateway) {
      toast('Selecciona Mercado Pago, Stripe o Clip primero', 'error')
      return
    }
    setSaving(true)
    try {
      await tenantRepository.updatePaymentConfig(ctx, config)
      const gw = PAYMENT_GATEWAYS.find((g) => g.id === config.gateway)
      toast(
        gw?.supportsPaymentLinks
          ? 'Credenciales guardadas — genera links desde POS → Tarjeta'
          : 'Clip conectado — cobra con tu terminal o app Clip y confirma en caja',
        'success',
      )
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!highlightGw) return
    const el = document.getElementById(`gateway-${highlightGw}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightGw])

  const activeGateway = PAYMENT_GATEWAYS.find((g) => g.id === (config.gateway || preferred))

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link to="/app/cash" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600 mb-3">
          <ArrowLeft size={14} /> Volver a Caja
        </Link>
        <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Finanzas</p>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <CreditCard size={24} /> Pasarelas de pago
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Conexión puente a Mercado Pago, Stripe (tu negocio) o Clip — para cobrar a comensales
        </p>
      </div>

      <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-r from-brand-50 to-orange-50 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Link2 size={20} className="text-brand-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">IA·RESTAURANT es solo un puente</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{PAYMENT_BRIDGE_NOTE}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 pt-2 border-t border-brand-200/80">
          <Info size={18} className="text-brand-600 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 leading-relaxed">{PAYMENT_LINK_ONLY_NOTE}</p>
        </div>
        <div className="flex items-start gap-3 pt-2 border-t border-brand-200/80">
          <Shield size={18} className="text-violet-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Plan IA·RESTAURANT (dueños de negocio):</strong> {SAAS_STRIPE_NOTE}{' '}
            <Link to="/app/subscriptions" className="text-brand-600 font-semibold hover:underline">
              Ver suscripción
            </Link>
            . {SAAS_BILLING_NOTE}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-command-border bg-white p-5">
        <p className="font-bold text-slate-800 mb-4">Cómo conectar (3 pasos)</p>
        <ol className="space-y-4">
          {CONNECT_STEPS.map((s) => (
            <li key={s.step} className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-black text-sm flex items-center justify-center shrink-0">
                {s.step}
              </span>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{s.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PAYMENT_GATEWAYS.map((gw) => (
          <div key={gw.id} id={`gateway-${gw.id}`} className={highlightGw === gw.id ? 'ring-2 ring-brand-400 rounded-2xl' : ''}>
            <PaymentGatewayCard
              gateway={gw}
              selected={(config.gateway || preferred) === gw.id}
              onSelect={() => handleSelect(gw.id)}
            />
          </div>
        ))}
      </div>

      {activeGateway && !loading && (
        <div className="rounded-2xl border border-command-border bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-brand-600" />
            <div>
              <p className="font-bold text-slate-800">
                {config.gateway === 'clip' ? `Conexión ${activeGateway.name}` : `Credenciales de ${activeGateway.name}`}
              </p>
              <p className="text-xs text-slate-500">
                {activeGateway.supportsPaymentLinks
                  ? `IA·RESTAURANT usa tus credenciales solo para crear links. El cobro lo hace ${activeGateway.name}.`
                  : 'Cobra con tu terminal o app Clip. El dinero va a tu cuenta Clip; IA·RESTAURANT no procesa el pago.'}
              </p>
            </div>
          </div>

          {activeGateway.credentialsHelpUrl && (
            <a
              href={activeGateway.credentialsHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-600 font-semibold hover:underline"
            >
              <ExternalLink size={12} /> ¿Dónde encuentro mis credenciales en {activeGateway.name}?
            </a>
          )}

          {config.gateway === 'mercadopago' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Public Key" placeholder="APP_USR-..." value={config.public_key || ''} onChange={e => setConfig(c => ({ ...c, public_key: e.target.value }))} />
              <Input label="Access Token" type="password" placeholder="APP_USR-..." value={config.access_token || ''} onChange={e => setConfig(c => ({ ...c, access_token: e.target.value }))} />
            </div>
          )}

          {config.gateway === 'stripe' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Publishable Key" placeholder="pk_live_..." value={config.public_key || ''} onChange={e => setConfig(c => ({ ...c, public_key: e.target.value }))} />
              <Input label="Secret Key" type="password" placeholder="sk_live_..." value={config.secret_key || ''} onChange={e => setConfig(c => ({ ...c, secret_key: e.target.value }))} />
            </div>
          )}

          {config.gateway === 'clip' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 bg-orange-50 rounded-xl p-4 border border-orange-100 leading-relaxed">
                No necesitas API keys. Crea tu cuenta Clip, cobra con terminal o genera links en la app Clip.
                En POS selecciona Tarjeta y confirma el cobro manualmente cuando Clip apruebe el pago.
              </p>
              <a href="https://www.clip.mx/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" type="button">
                  <ExternalLink size={14} /> Crear cuenta en Clip
                </Button>
              </a>
            </div>
          )}

          <Button onClick={handleSaveCredentials} loading={saving} className="w-full sm:w-auto">
            <Save size={14} /> {config.gateway === 'clip' ? 'Confirmar conexión Clip' : 'Guardar credenciales'}
          </Button>
        </div>
      )}

      <p className="text-center text-[10px] text-slate-400 font-mono pb-4 leading-relaxed max-w-xl mx-auto">
        MP/Stripe: POS → Tarjeta → “Generar link de pago”. Clip: cobra en tu terminal o app y confirma en caja.
      </p>
    </div>
  )
}
