import { Link } from 'react-router-dom'
import { DollarSign, ShoppingCart, Grid3X3, TrendingUp, Clock, Sparkles, Layers, ArrowRight } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useLiveOps } from '@/hooks/useLiveOps'
import { dashboardRepository } from '@/repositories/dashboardRepository'
import { useTenantContext } from '@/hooks/useTenantContext'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const ctx = useTenantContext()
  const { user, tenant, sucursal } = useAuthStore()
  const { stats, insights } = useLiveOps()
  const [activeOrders, setActiveOrders] = useState<Awaited<ReturnType<typeof dashboardRepository.getActiveOrdersForTable>>>([])

  useEffect(() => {
    if (!ctx) return
    dashboardRepository.getActiveOrdersForTable(ctx).then(setActiveOrders)
    const i = setInterval(() => dashboardRepository.getActiveOrdersForTable(ctx).then(setActiveOrders), 10000)
    return () => clearInterval(i)
  }, [ctx])

  if (!stats) return <div className="text-slate-500 font-mono text-sm">Sincronizando centro de mando...</div>

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="glass-panel rounded-2xl p-5 bg-white border-2 border-orange-300">
        <p className="font-black text-slate-800 mb-2">🔴 Demo flujo QR conectado — pruébalo ahora</p>
        <p className="text-sm text-slate-600 mb-3">Abre estas 4 pantallas en pestañas separadas y haz un pedido desde el celular:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { label: '1. Comensal QR', url: '/comensal?mesa=5' },
            { label: '2. Caja valida', url: '/caja' },
            { label: '3. Mesero alertas', url: '/mesero' },
            { label: '4. Cocina KDS', url: '/app/kitchen' },
          ].map(s => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer"
              className="p-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 font-bold text-center hover:bg-brand-100">
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <Link to="/app/modules" className="block glass-panel rounded-2xl p-5 bg-gradient-to-r from-brand-50 to-orange-50 border border-brand-200 hover:shadow-glow transition-all group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-100 text-brand-600"><Layers size={20} /></div>
            <div>
              <p className="font-black text-slate-800">Explorar todos los módulos demo</p>
              <p className="text-sm text-slate-500">45+ fases · POS, inventario, CRM, QR, IA, SaaS y más</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-brand-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
      <div className="glass-panel rounded-2xl p-5 bg-white border border-command-border">
        <p className="text-[10px] font-mono text-orange-600 uppercase tracking-[0.2em] mb-1">Centro de mando</p>
        <h2 className="text-2xl font-black text-slate-800">{tenant?.name || 'Mi Restaurante'}</h2>
        {sucursal && <p className="text-sm text-slate-500 mt-1">{sucursal.name}</p>}
        <p className="text-sm text-slate-600 mt-3">
          Operador: <span className="text-slate-800 font-semibold">{user?.full_name}</span>
        </p>
      </div>

      <div className="flex items-center justify-end">
        <Badge variant="ai" className="gap-1.5">
          <Sparkles size={10} /> IA activa
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ventas hoy" value={formatCurrency(stats.today_sales)} icon={DollarSign} color="amber" />
        <StatCard label="Órdenes" value={stats.today_orders} icon={ShoppingCart} color="ai" />
        <StatCard label="Mesas activas" value={`${stats.active_tables}/${stats.total_tables}`} icon={Grid3X3} color="success" />
        <StatCard label="Ticket prom." value={formatCurrency(stats.avg_ticket)} icon={TrendingUp} color="info" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Flujo de ventas</h3>
              <Badge variant="success">En vivo</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.hourly_sales} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), 'Ventas']}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#64748b' }}
                />
                <Bar dataKey="amount" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h3 className="font-bold text-slate-800">Top del día</h3></CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-command-border">
              {stats.top_products.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 text-xs font-mono font-bold flex items-center justify-center">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{p.count} uds</p>
                  </div>
                  <p className="text-sm font-mono text-brand-600">{formatCurrency(p.revenue)}</p>
                </li>
              ))}
              {stats.top_products.length === 0 && (
                <li className="px-5 py-8 text-center text-slate-500 text-sm">Sin ventas registradas hoy</li>
              )}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {insights.slice(0, 3).map(ins => (
          <div key={ins.id} className="glass-panel rounded-xl p-4 border border-command-border bg-white">
            <p className="text-[10px] font-mono text-ai-600 uppercase tracking-wider">{ins.type}</p>
            <p className="text-sm font-bold text-slate-800 mt-1">{ins.title}</p>
            <p className="text-xs text-slate-500 mt-1">{ins.message}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800">Órdenes en piso</h3>
          <Badge variant="info">{activeOrders.length} activas</Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-command-border bg-brand-50/50">
                {['Folio', 'Mesa', 'Estado', 'Tiempo', 'Total'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-command-border">
              {activeOrders.map(o => (
                <tr key={o.folio} className="hover:bg-brand-50/30">
                  <td className="px-5 py-3 font-mono text-xs text-brand-600">{o.folio}</td>
                  <td className="px-5 py-3 text-slate-800">{o.table}</td>
                  <td className="px-5 py-3"><Badge variant={o.status === 'listo' ? 'success' : o.status === 'preparando' ? 'amber' : 'warning'} className="capitalize">{o.status}</Badge></td>
                  <td className="px-5 py-3 text-slate-500 flex items-center gap-1"><Clock size={12}/>{o.time}</td>
                  <td className="px-5 py-3 font-mono text-slate-800">{formatCurrency(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
