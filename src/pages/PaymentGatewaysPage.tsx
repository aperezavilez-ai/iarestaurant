import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CreditCard, Info, Shield, ArrowLeft, Key, Save } from 'lucide-react'
import { PaymentGatewayCard } from '@/components/payments/PaymentGatewayCard'
import { PAYMENT_GATEWAYS, SAAS_BILLING_NOTE } from '@/data/paymentGateways'
import { usePaymentGatewayStore } from '@/store/paymentGatewayStore'
import { useAuthStore } from '@/store/authStore'
import { useTenantContext } from '@/hooks/useTenantContext'
import { tenantRepository } from '@/repositories/tenantRepository'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import type { PaymentGatewayId } from '@/data/paymentGateways'
import type { PaymentConfig } from '@/types'

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
      setConfig(c)
      if (c.gateway) setPreferred(tenantId, c.gateway)
      setLoading(false)
    })
  }, [ctx, tenantId, setPreferred])

  const handleSelect = (id: PaymentGatewayId) => {
    if (!tenantId) return
    const next = preferred === id ? null : id
    setPreferred(tenantId, next)
    setConfig((c) => ({ ...c, gateway: next || undefined }))
    const name = PAYMENT_GATEWAYS.find((g) => g.id === id)?.name
    toast(
      next ? `${name} marcado como pasarela para cobros en restaurante` : 'Preferencia de pasarela quitada',
      'success',
    )
  }

  const handleSaveCredentials = async () => {
    if (!ctx || !config.gateway) {
      toast('Selecciona una pasarela principal primero', 'error')
      return
    }
    setSaving(true)
    try {
      await tenantRepository.updatePaymentConfig(ctx, config)
      toast('Credenciales guardadas — ya puedes generar links desde POS', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudieron guardar las credenciales', 'error')
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
              <p className="font-bold text-slate-800">Credenciales de {activeGateway.name}</p>
              <p className="text-xs text-slate-500">Se guardan en tu organización. El cobro va directo a tu cuenta del proveedor.</p>
            </div>
          </div>

          {config.gateway === 'mercadopago' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Public Key"
                placeholder="APP_USR-..."
                value={config.public_key || ''}
                onChange={e => setConfig(c => ({ ...c, public_key: e.target.value }))}
              />
              <Input
                label="Access Token"
                type="password"
                placeholder="APP_USR-..."
                value={config.access_token || ''}
                onChange={e => setConfig(c => ({ ...c, access_token: e.target.value }))}
              />
            </div>
          )}

          {config.gateway === 'stripe' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Publishable Key"
                placeholder="pk_live_..."
                value={config.public_key || ''}
                onChange={e => setConfig(c => ({ ...c, public_key: e.target.value }))}
              />
              <Input
                label="Secret Key"
                type="password"
                placeholder="sk_live_..."
                value={config.secret_key || ''}
                onChange={e => setConfig(c => ({ ...c, secret_key: e.target.value }))}
              />
            </div>
          )}

          {config.gateway === 'clip' && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">
              Clip se usa con terminal o link manual desde tu app Clip. La generación automática de links estará disponible pronto.
            </p>
          )}

          {(config.gateway === 'mercadopago' || config.gateway === 'stripe') && (
            <Button onClick={handleSaveCredentials} loading={saving} className="w-full sm:w-auto">
              <Save size={14} /> Guardar credenciales
            </Button>
          )}
        </div>
      )}

      <p className="text-center text-[10px] text-slate-400 font-mono pb-4">
        Con credenciales guardadas, en POS → Tarjeta puedes generar un link de pago para el comensal
      </p>
    </div>
  )
}
