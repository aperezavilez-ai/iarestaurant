import { ModuleLayout } from '@/components/demo/ModuleLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import {
  DEMO_PLANS, DEMO_PERMISSIONS, DEMO_NOTIFICATIONS, DEMO_INTEGRATIONS,
  DEMO_TICKETS, DEMO_EMPLOYEES, DEMO_WORKFLOWS, DEMO_MARKETPLACE,
  DEMO_SAAS_METRICS, DEMO_AUDIT_LOGS,
} from '@/data/demoSeed'
import { useAuthStore } from '@/store/authStore'
import { Plus, Check, X } from 'lucide-react'

export function SubscriptionsPage() {
  const { tenant } = useAuthStore()
  return (
    <ModuleLayout phase={11} title="Suscripciones SaaS" description="Planes, límites, prueba gratuita, renovación y facturación de suscripciones.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEMO_PLANS.map(p => (
          <Card key={p.id} className={`p-6 ${tenant?.plan === p.name ? 'border-brand-400 shadow-glow' : ''}`}>
            {tenant?.plan === p.name && <Badge variant="amber" className="mb-3">Plan actual</Badge>}
            <p className="text-lg font-black capitalize text-slate-800">{p.name}</p>
            <p className="text-3xl font-black text-brand-600 mt-2">{formatCurrency(p.price)}<span className="text-sm text-slate-500">/mes</span></p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>{p.max_users} usuarios · {p.max_branches} sucursales</li>
              <li>{p.max_tables} mesas · {p.max_products} productos</li>
              {p.features.map(f => <li key={f} className="flex items-center gap-1"><Check size={12} className="text-ops-success" />{f}</li>)}
            </ul>
            <Button className="w-full mt-4" variant={tenant?.plan === p.name ? 'secondary' : 'primary'} size="sm">
              {tenant?.plan === p.name ? 'Plan activo' : 'Cambiar plan'}
            </Button>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function AuditPage() {
  return (
    <ModuleLayout phase={12} title="Auditoría empresarial" description="Registro inmutable de altas, ediciones, ventas, caja e inventario.">
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            {['Usuario', 'Acción', 'Tabla', 'Detalle', 'Fecha/Hora'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {DEMO_AUDIT_LOGS.map(a => (
              <tr key={a.id} className="hover:bg-brand-50/30">
                <td className="px-4 py-3 font-semibold">{a.user}</td>
                <td className="px-4 py-3"><Badge variant={a.action === 'INSERT' ? 'success' : 'info'}>{a.action}</Badge></td>
                <td className="px-4 py-3 font-mono text-xs">{a.table}</td>
                <td className="px-4 py-3 text-slate-600">{a.detail}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{a.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </ModuleLayout>
  )
}

export function PermissionsPage() {
  return (
    <ModuleLayout phase={13} title="Permisos RBAC avanzados" description="Crear, leer, editar, eliminar y autorizar por módulo.">
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            <th className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">Módulo</th>
            {['Crear', 'Leer', 'Editar', 'Eliminar', 'Autorizar'].map(h => (
              <th key={h} className="text-center px-3 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {DEMO_PERMISSIONS.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-semibold">{p.module}</td>
                {(['create', 'read', 'update', 'delete', 'authorize'] as const).map(k => (
                  <td key={k} className="text-center px-3 py-3">
                    {p[k] ? <Check size={16} className="text-ops-success mx-auto" /> : <X size={16} className="text-slate-300 mx-auto" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </ModuleLayout>
  )
}

export function NotificationsPage() {
  return (
    <ModuleLayout phase={0} title="Motor de notificaciones" description="Push, WhatsApp, email, SMS — plantillas y automatizaciones por tenant.">
      <div className="grid gap-3">
        {DEMO_NOTIFICATIONS.map(n => (
          <Card key={n.id} className="p-4 flex justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="info" className="uppercase text-[9px]">{n.channel}</Badge>
                <p className="font-bold text-sm">{n.title}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">{n.message}</p>
            </div>
            <Badge variant={n.status === 'enviada' ? 'success' : 'warning'} className="capitalize shrink-0">{n.status}</Badge>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function IntegrationsPage() {
  return (
    <ModuleLayout phase={42} title="Centro de integraciones" description="WhatsApp, Stripe, Mercado Pago, delivery, ERP y más.">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEMO_INTEGRATIONS.map(i => (
          <Card key={i.id} className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{i.icon}</span>
              <div>
                <p className="font-bold text-slate-800">{i.name}</p>
                <p className="text-xs text-slate-500">{i.category}</p>
              </div>
            </div>
            <Badge variant={i.status === 'conectado' ? 'success' : i.status === 'disponible' ? 'info' : 'default'} className="mt-3 capitalize">{i.status}</Badge>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function SupportPage() {
  return (
    <ModuleLayout phase={29} title="Centro de soporte" description="Tickets, chat, base de conocimiento y diagnóstico remoto."
      actions={<Button size="sm"><Plus size={14} /> Nuevo ticket</Button>}>
      <div className="grid gap-3">
        {DEMO_TICKETS.map(t => (
          <Card key={t.id} className="p-4 flex justify-between">
            <div>
              <p className="font-bold">{t.subject}</p>
              <p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString('es-MX')}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={t.priority === 'alta' ? 'danger' : t.priority === 'media' ? 'warning' : 'default'}>{t.priority}</Badge>
              <Badge variant={t.status === 'resuelto' ? 'success' : 'info'} className="capitalize">{t.status.replace('_', ' ')}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function HRPage() {
  return (
    <ModuleLayout phase={24} title="Recursos humanos" description="Expedientes, turnos, asistencia, comisiones y evaluaciones.">
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/50 border-b"><tr>
            {['Empleado', 'Rol', 'Turno', 'Asistencia', 'Horas/semana'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y">
            {DEMO_EMPLOYEES.map(e => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-semibold">{e.full_name}</td>
                <td className="px-4 py-3 capitalize">{e.role}</td>
                <td className="px-4 py-3">{e.shift}</td>
                <td className="px-4 py-3"><Badge variant={e.attendance === 'presente' ? 'success' : e.attendance === 'retardo' ? 'warning' : 'danger'} className="capitalize">{e.attendance}</Badge></td>
                <td className="px-4 py-3 font-mono">{e.hours_week}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </ModuleLayout>
  )
}

export function AutomationPage() {
  return (
    <ModuleLayout phase={35} title="Automatizaciones" description="Evento → Condición → Acción configurable sin código."
      actions={<Button size="sm"><Plus size={14} /> Nueva regla</Button>}>
      <div className="grid gap-3">
        {DEMO_WORKFLOWS.map(w => (
          <Card key={w.id} className="p-4">
            <div className="flex justify-between items-start">
              <p className="font-bold text-slate-800">{w.name}</p>
              <Badge variant={w.active ? 'success' : 'default'}>{w.active ? 'Activa' : 'Inactiva'}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs font-mono text-slate-500">
              <span className="bg-brand-50 px-2 py-1 rounded">{w.trigger}</span>
              <span>→</span>
              <span className="bg-orange-50 px-2 py-1 rounded">{w.condition}</span>
              <span>→</span>
              <span className="bg-green-50 px-2 py-1 rounded">{w.action}</span>
            </div>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function MarketplacePage() {
  return (
    <ModuleLayout phase={28} title="Marketplace de módulos" description="Extensiones, add-ons y licenciamiento por módulo.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DEMO_MARKETPLACE.map(m => (
          <Card key={m.id} className="p-5 flex justify-between items-center">
            <div>
              <p className="font-bold">{m.name}</p>
              <p className="text-xs text-slate-500">{m.author} · {m.category}</p>
              <p className="font-mono font-bold text-brand-600 mt-1">{formatCurrency(m.price)}/mes</p>
            </div>
            <Button size="sm" variant={m.installed ? 'secondary' : 'primary'}>{m.installed ? 'Instalado' : 'Instalar'}</Button>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function SaaSOwnerPage() {
  return (
    <ModuleLayout phase={45} title="Dashboard SaaS del propietario" description="MRR, ARR, churn, CAC, LTV y salud de la plataforma.">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_SAAS_METRICS.map(m => (
          <Card key={m.label} className="p-5">
            <p className="text-[10px] font-mono text-slate-500 uppercase">{m.label}</p>
            <p className="text-2xl font-black text-slate-800 mt-2">{m.value}</p>
            {m.trend && <p className="text-xs text-ops-success font-mono mt-1">{m.trend}</p>}
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function FranchisePage() {
  return (
    <ModuleLayout phase={32} title="Franquicias y corporativos" description="Regalías, catálogo maestro, menús corporativos y reportes consolidados.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="font-bold text-slate-800">IA-RESTAURANT Corporativo</p>
          <p className="text-sm text-slate-500 mt-2">2 sucursales · 1 marca · Plan Profesional</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Regalía mensual</span><span className="font-bold">5%</span></div>
            <div className="flex justify-between"><span>Catálogo corporativo</span><Badge variant="success">Sincronizado</Badge></div>
          </div>
        </Card>
        <Card className="p-5">
          <p className="font-bold text-slate-800">Reporte consolidado</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Ventas red</span><span className="font-mono font-bold">{formatCurrency(48200)}</span></div>
            <div className="flex justify-between"><span>Sucursal Centro</span><span className="font-mono">{formatCurrency(32100)}</span></div>
            <div className="flex justify-between"><span>Sucursal Polanco</span><span className="font-mono">{formatCurrency(16100)}</span></div>
          </div>
        </Card>
      </div>
    </ModuleLayout>
  )
}

export function SecurityPage() {
  const features = [
    { name: 'MFA (doble factor)', status: 'configurable' },
    { name: 'Bloqueo por intentos fallidos', status: 'activo' },
    { name: 'Control de sesiones activas', status: 'activo' },
    { name: 'Cifrado de datos sensibles', status: 'activo' },
    { name: 'Rotación de credenciales', status: 'programado' },
    { name: 'Protección OWASP Top 10', status: 'activo' },
  ]
  return (
    <ModuleLayout phase={0} title="Seguridad empresarial" description="MFA, sesiones, cifrado, OWASP y auditoría de accesos.">
      <div className="grid gap-3">
        {features.map(f => (
          <Card key={f.name} className="p-4 flex justify-between items-center">
            <span className="font-semibold text-slate-800">{f.name}</span>
            <Badge variant={f.status === 'activo' ? 'success' : 'info'} className="capitalize">{f.status}</Badge>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function APIPage() {
  return (
    <ModuleLayout phase={16} title="API pública REST" description="OpenAPI, Swagger, API Keys, OAuth, rate limiting y webhooks.">
      <Card className="p-5 font-mono text-sm space-y-3">
        <p className="text-slate-500">Base URL</p>
        <p className="bg-command-elevated px-3 py-2 rounded-lg">https://api.iarestaurant.com/v1</p>
        <p className="text-slate-500 mt-4">Endpoints disponibles (demo)</p>
        {['GET /orders', 'POST /orders', 'GET /products', 'GET /tables', 'POST /payments', 'GET /reports/sales'].map(e => (
          <p key={e} className="bg-brand-50 px-3 py-2 rounded-lg text-brand-700">{e}</p>
        ))}
      </Card>
    </ModuleLayout>
  )
}

export function OnboardingPage() {
  const steps = [
    { name: 'Datos del restaurante', done: true },
    { name: 'Configurar mesas', done: true },
    { name: 'Cargar menú', done: true },
    { name: 'Crear usuarios', done: false },
    { name: 'Configurar impresoras', done: false },
    { name: 'Conectar pagos', done: false },
  ]
  const pct = Math.round(steps.filter(s => s.done).length / steps.length * 100)
  return (
    <ModuleLayout phase={41} title="Onboarding inteligente" description="Asistente de configuración inicial paso a paso."
      stats={[{ label: 'Progreso', value: `${pct}%` }]}>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <Card key={s.name} className={`p-4 flex items-center gap-4 ${s.done ? 'opacity-80' : 'border-brand-300'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${s.done ? 'bg-ops-success text-white' : 'bg-brand-100 text-brand-700'}`}>{i + 1}</div>
            <p className="font-semibold flex-1">{s.name}</p>
            {s.done ? <Badge variant="success">Completado</Badge> : <Button size="sm">Continuar</Button>}
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function VersioningPage() {
  return (
    <ModuleLayout phase={39} title="Versiones y despliegues" description="Feature flags, canal beta, rollback automático y notas de versión.">
      <Card className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-black text-xl text-slate-800">v1.0.0</p>
            <p className="text-xs text-slate-500">Demo completo — Junio 2026</p>
          </div>
          <Badge variant="success">Estable</Badge>
        </div>
        <ul className="text-sm text-slate-600 space-y-2">
          <li>✓ 45+ módulos demo navegables</li>
          <li>✓ POS, mesas, cocina, inventario, CRM</li>
          <li>✓ IA Copiloto y IA-Support</li>
          <li>✓ Comensal y Mesero móvil</li>
          <li>→ Próximo: despliegue en producción</li>
        </ul>
      </Card>
    </ModuleLayout>
  )
}

export function LocalizationPage() {
  return (
    <ModuleLayout phase={0} title="Internacionalización" description="Múltiples idiomas, monedas, zonas horarias y formatos regionales.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Idioma', value: 'Español (MX)' },
          { label: 'Moneda', value: 'MXN — Peso mexicano' },
          { label: 'Zona horaria', value: 'America/Mexico_City' },
        ].map(i => (
          <Card key={i.label} className="p-5 text-center">
            <p className="text-[10px] font-mono text-slate-500 uppercase">{i.label}</p>
            <p className="font-bold text-slate-800 mt-2">{i.value}</p>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function DataWarehousePage() {
  return (
    <ModuleLayout phase={27} title="Data Warehouse" description="ETL, tablas agregadas, cubos analíticos — desacoplado de operación POS.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Registros históricos', value: '1.2M' },
          { label: 'ETL última corrida', value: 'Hace 2h' },
          { label: 'Cubos activos', value: '8' },
          { label: 'Tiempo consulta avg', value: '120ms' },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className="text-[10px] font-mono text-slate-500 uppercase">{s.label}</p>
            <p className="text-xl font-black mt-1">{s.value}</p>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function BIPage() {
  const kpis = [
    { label: 'Ticket promedio', value: '$491', trend: '+8%' },
    { label: 'Rotación mesas', value: '3.2x', trend: '+0.4' },
    { label: 'Tiempo servicio', value: '18 min', trend: '-2 min' },
    { label: 'Margen producto', value: '62%', trend: '+3%' },
  ]
  return (
    <ModuleLayout phase={26} title="Business Intelligence" description="KPIs operativos, forecast, benchmarking y dashboards personalizados.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="p-5">
            <p className="text-[10px] font-mono text-slate-500 uppercase">{k.label}</p>
            <p className="text-2xl font-black mt-2">{k.value}</p>
            <p className="text-xs text-ops-success font-mono mt-1">{k.trend}</p>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function AntifraudPage() {
  const alerts = [
    { type: 'Cancelaciones', detail: '3 cancelaciones en 10 min — Mesa 7', level: 'media' },
    { type: 'Reimpresiones', detail: '5 reimpresiones ticket ORD-0089', level: 'baja' },
    { type: 'Descuentos', detail: 'Descuento 50% sin autorización', level: 'alta' },
  ]
  return (
    <ModuleLayout phase={44} title="Motor antifraude" description="Detección de cancelaciones, reimpresiones y descuentos anómalos.">
      <div className="grid gap-3">
        {alerts.map((a, i) => (
          <Card key={i} className="p-4 flex justify-between">
            <div>
              <p className="font-bold">{a.type}</p>
              <p className="text-xs text-slate-500 mt-1">{a.detail}</p>
            </div>
            <Badge variant={a.level === 'alta' ? 'danger' : a.level === 'media' ? 'warning' : 'info'}>{a.level}</Badge>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}

export function CustomerSuccessPage() {
  return (
    <ModuleLayout phase={36} title="Customer Success" description="Adopción, NPS, retención y academia IA·RESTAURANT.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'NPS', value: '72', sub: 'Promotores' },
          { label: 'Adopción promedio', value: '78%', sub: 'Módulos activos' },
          { label: 'Riesgo churn', value: '3', sub: 'Restaurantes' },
        ].map(s => (
          <Card key={s.label} className="p-5 text-center">
            <p className="text-[10px] font-mono text-slate-500 uppercase">{s.label}</p>
            <p className="text-3xl font-black text-brand-600 mt-2">{s.value}</p>
            <p className="text-xs text-slate-500">{s.sub}</p>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  )
}
