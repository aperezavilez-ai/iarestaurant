import { useEffect, useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { Building2, Globe, Bell, CreditCard, QrCode, MessageCircle, Send } from 'lucide-react'
import { useLiveFlowStore } from '@/store/liveFlowStore'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useTenantContext } from '@/hooks/useTenantContext'
import { tenantRepository } from '@/repositories/tenantRepository'
import { catalogRepository } from '@/repositories/catalogRepository'
import { tableRepository } from '@/repositories/tableRepository'
import { whatsappService } from '@/services/whatsappService'
import { AuthorizedDevicesPanel } from '@/components/security/AuthorizedDevicesPanel'
import type { Organization, WhatsAppConfig } from '@/types'

export default function SettingsPage() {
  const { tenant, sucursal, setTenant } = useAuthStore()
  const ctx = useTenantContext()
  const [org, setOrg] = useState<Organization | null>(null)
  const [form, setForm] = useState({
    tenantName: '',
    rfc: '',
    phone: '',
    email: '',
    address: '',
    whatsappAlerts: '',
    reportsEmail: '',
    timezone: 'America/Mexico_City',
    currency: 'MXN',
    taxRate: '16',
    waPhoneNumberId: '',
    waAccessToken: '',
    alertOrderReady: true,
    alertPaymentComplete: false,
  })
  const [saving, setSaving] = useState(false)
  const [testingWa, setTestingWa] = useState(false)
  const [usage, setUsage] = useState({ sucursales: 0, usuarios: 4, mesas: 0, productos: 0 })

  useEffect(() => {
    if (!ctx) return
    tenantRepository.getBusinessProfile(ctx).then((profile) => {
      if (!profile) return
      setOrg(profile.organization)
      const wa = profile.organization?.whatsapp_config
      setForm({
        tenantName: profile.tenant.name,
        rfc: profile.organization?.rfc || '',
        phone: profile.organization?.phone || profile.sucursal?.phone || '',
        email: profile.organization?.email || '',
        address: profile.organization?.address || profile.sucursal?.address || '',
        whatsappAlerts: profile.organization?.whatsapp_alerts || '',
        reportsEmail: profile.organization?.reports_email || profile.organization?.email || '',
        timezone: profile.sucursal?.timezone || 'America/Mexico_City',
        currency: profile.sucursal?.currency || 'MXN',
        taxRate: String(profile.sucursal?.tax_rate ?? 16),
        waPhoneNumberId: wa?.phone_number_id || '',
        waAccessToken: wa?.access_token || '',
        alertOrderReady: wa?.alerts?.order_ready !== false,
        alertPaymentComplete: wa?.alerts?.payment_complete === true,
      })
    })
    Promise.all([
      tenantRepository.getBusinessProfile(ctx),
      catalogRepository.getProducts(ctx),
      tableRepository.getTables(ctx),
    ]).then(([profile, products, tables]) => {
      setUsage({
        sucursales: profile?.sucursal ? 1 : 0,
        usuarios: 4,
        mesas: tables.length,
        productos: products.filter(p => p.is_active).length,
      })
    })
  }, [ctx])

  const validationMode = useLiveFlowStore(s => s.validationMode)
  const setValidationMode = useLiveFlowStore(s => s.setValidationMode)

  const handleSave = async () => {
    if (!ctx || !form.tenantName.trim()) return
    setSaving(true)
    try {
      const taxRate = Number(form.taxRate)
      const whatsappConfig: WhatsAppConfig = {
        phone_number_id: form.waPhoneNumberId.trim() || undefined,
        access_token: form.waAccessToken.trim() || undefined,
        alerts: {
          order_ready: form.alertOrderReady,
          payment_complete: form.alertPaymentComplete,
        },
      }
      const profile = await tenantRepository.updateBusiness(ctx, {
        tenantName: form.tenantName,
        rfc: form.rfc,
        phone: form.phone,
        email: form.email,
        address: form.address,
        whatsappAlerts: form.whatsappAlerts,
        reportsEmail: form.reportsEmail,
        whatsappConfig,
        timezone: form.timezone,
        currency: form.currency,
        taxRate: Number.isFinite(taxRate) ? taxRate : 16,
      })
      setTenant(profile.tenant)
      setOrg(profile.organization)
      toast('Configuración guardada', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTestWhatsApp = async () => {
    if (!ctx || !form.whatsappAlerts.trim()) {
      toast('Guarda primero un número WhatsApp para alertas', 'error')
      return
    }
    setTestingWa(true)
    try {
      const result = await whatsappService.sendAlert(ctx, {
        type: 'test',
        title: 'Prueba IA·RESTAURANT',
        message: 'Las alertas WhatsApp están configuradas correctamente.',
      })
      if (result.status === 'enviada') {
        toast('Mensaje de prueba enviado', 'success')
      } else if (result.wa_url) {
        whatsappService.openWhatsAppLink(result.wa_url)
        toast('Abre WhatsApp para enviar el mensaje de prueba', 'success')
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo probar WhatsApp', 'error')
    } finally {
      setTestingWa(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600"><QrCode size={18} /></div>
            <h3 className="font-bold text-slate-800">Pedidos QR — flujo de validación</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3">
            {(['validacion', 'automatico'] as const).map(mode => (
              <button key={mode} onClick={() => { setValidationMode(mode); toast(`Modo ${mode === 'validacion' ? 'Caja valida' : 'Automático'}`, 'success') }}
                className={cn('p-4 rounded-xl border text-left transition-all',
                  validationMode === mode ? 'border-brand-400 bg-brand-50' : 'border-gray-200')}>
                <p className="font-bold text-sm">{mode === 'validacion' ? 'Caja valida' : 'Automático'}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {mode === 'validacion' ? 'Comensal → Caja aprueba → Cocina' : 'Comensal → Directo a cocina'}
                </p>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600"><Building2 size={18} /></div>
            <div>
              <h3 className="font-bold text-slate-800">Información del restaurante</h3>
              <p className="text-xs text-slate-500">Aparece en el sistema, tickets y menú comensal</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre del negocio" value={form.tenantName} onChange={e => setForm(f => ({ ...f, tenantName: e.target.value }))} />
            <Input label="RFC / NIT" value={form.rfc} onChange={e => setForm(f => ({ ...f, rfc: e.target.value }))} />
            <Input label="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Correo electrónico" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
            <Input label="Dirección" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="sm:col-span-2" />
          </div>
          {sucursal && (
            <p className="text-xs text-slate-500">Sucursal activa: <strong>{sucursal.name}</strong></p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600"><Globe size={18} /></div>
            <h3 className="font-bold">Región e impuestos</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Zona horaria" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} />
            <Input label="Moneda" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
            <Input label="IVA (%)" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} type="number" />
          </div>
        </CardBody>
      </Card>

      <Card id="notificaciones">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600"><Bell size={18} /></div>
            <h3 className="font-bold">Notificaciones</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="WhatsApp del equipo (recibe alertas)"
              placeholder="+52 55 0000 0000"
              value={form.whatsappAlerts}
              onChange={e => setForm(f => ({ ...f, whatsappAlerts: e.target.value }))}
            />
            <Input
              label="Email de reportes"
              placeholder={org?.email || 'reportes@restaurante.com'}
              type="email"
              value={form.reportsEmail}
              onChange={e => setForm(f => ({ ...f, reportsEmail: e.target.value }))}
            />
          </div>

          <div className="rounded-xl border border-command-border p-4 space-y-3 bg-slate-50/50">
            <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MessageCircle size={16} className="text-green-600" /> Alertas automáticas
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.alertOrderReady}
                onChange={e => setForm(f => ({ ...f, alertOrderReady: e.target.checked }))}
                className="rounded border-slate-300"
              />
              Pedido listo en cocina (KDS)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.alertPaymentComplete}
                onChange={e => setForm(f => ({ ...f, alertPaymentComplete: e.target.checked }))}
                className="rounded border-slate-300"
              />
              Cobro registrado en caja
            </label>
          </div>

          <div className="rounded-xl border border-dashed border-brand-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-700">WhatsApp Cloud API (opcional — envío automático)</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Sin credenciales, al marcar pedido listo se abre WhatsApp con el mensaje listo para enviar.
              Con Phone Number ID y Access Token de Meta, el envío es automático.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Phone Number ID"
                placeholder="ID de tu número Business"
                value={form.waPhoneNumberId}
                onChange={e => setForm(f => ({ ...f, waPhoneNumberId: e.target.value }))}
              />
              <Input
                label="Access Token"
                type="password"
                placeholder="Token permanente Meta"
                value={form.waAccessToken}
                onChange={e => setForm(f => ({ ...f, waAccessToken: e.target.value }))}
              />
            </div>
            <Button variant="outline" size="sm" loading={testingWa} onClick={handleTestWhatsApp}>
              <Send size={14} /> Enviar prueba
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} disabled={!form.tenantName.trim()}>
          Guardar configuración
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600"><CreditCard size={18} /></div>
            <div>
              <h3 className="font-bold">Plan: {tenant?.plan || 'profesional'}</h3>
              <p className="text-xs text-slate-500">Límites del plan actual</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Sucursales', used: usage.sucursales, max: tenant?.max_sucursales || 5 },
              { label: 'Usuarios', used: usage.usuarios, max: tenant?.max_usuarios || 20 },
              { label: 'Mesas', used: usage.mesas, max: tenant?.max_mesas || 50 },
              { label: 'Productos', used: usage.productos, max: tenant?.max_productos || 200 },
            ].map(l => (
              <div key={l.label} className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">{l.label}</p>
                <p className="text-2xl font-black">{l.used}<span className="text-sm font-normal text-slate-400">/{l.max}</span></p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                  <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (l.used / l.max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <AuthorizedDevicesPanel />
    </div>
  )
}
