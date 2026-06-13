import { useEffect, useState } from 'react'
import { FileDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useTenantContext } from '@/hooks/useTenantContext'
import { reportsRepository } from '@/repositories/reportsRepository'
import { exportSalesReportPdf } from '@/services/pdfReportService'
import { toast } from '@/components/ui/Toast'

export default function ReportsPage() {
  const ctx = useTenantContext()
  const [weekly, setWeekly] = useState<{ day: string; sales: number }[]>([])
  const [categories, setCategories] = useState<{ name: string; value: number; color: string }[]>([])
  const [summary, setSummary] = useState({ weekSales: 0, weekOrders: 0, avgTicket: 0, cancelRate: 0, cancelled: 0 })
  const [payments, setPayments] = useState<{ method: string; amount: number }[]>([])
  const [weeklyFull, setWeeklyFull] = useState<{ day: string; sales: number; orders: number }[]>([])
  const [categoriesFull, setCategoriesFull] = useState<{ name: string; value: number; revenue: number; color: string }[]>([])

  useEffect(() => {
    if (!ctx) return
    reportsRepository.getFullReport(ctx).then(({ weekly, categories, summary, payments }) => {
      setWeekly(weekly)
      setWeeklyFull(weekly)
      setCategories(categories.length ? categories : [{ name: 'Sin datos', value: 100, color: '#94A3B8', revenue: 0 }])
      setCategoriesFull(categories)
      setSummary(summary)
      setPayments(payments)
    })
  }, [ctx])

  const hasData = summary.weekOrders > 0

  const handleExportPdf = () => {
    if (!hasData) {
      toast('No hay ventas para exportar', 'error')
      return
    }
    exportSalesReportPdf({
      generatedAt: new Date().toLocaleString('es-MX'),
      summary,
      weekly: weeklyFull,
      categories: categoriesFull,
      payments,
    })
    toast('PDF generado', 'success')
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Análisis</p>
          <h1 className="text-2xl font-black text-slate-800">Reportes</h1>
          <p className="text-sm text-slate-500">{hasData ? 'Datos reales de ventas cobradas' : 'Realiza ventas en POS para ver reportes'}</p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0" onClick={handleExportPdf} disabled={!hasData}>
          <FileDown size={16} /> Exportar PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas semana', value: formatCurrency(summary.weekSales), sub: `${summary.weekOrders} órdenes` },
          { label: 'Ticket prom.', value: formatCurrency(summary.avgTicket), sub: 'últimos 7 días' },
          { label: 'Cancelaciones', value: `${summary.cancelRate.toFixed(1)}%`, sub: `${summary.cancelled} órdenes` },
          { label: 'Métodos pago', value: String(payments.length), sub: payments.map(p => p.method).join(', ') || '—' },
        ].map(k => (
          <Card key={k.label}>
            <CardBody>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{k.label}</p>
              <p className="text-2xl font-mono font-black text-slate-800 mt-2">{k.value}</p>
              <p className="text-xs text-slate-500 font-mono mt-1">{k.sub}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader><h3 className="font-bold text-slate-800">Ventas últimos 7 días</h3></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weekly} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }} formatter={(v: number) => [formatCurrency(v), 'Ventas']} />
                <Bar dataKey="sales" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h3 className="font-bold text-slate-800">Por categoría</h3></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categories.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {payments.length > 0 && (
        <Card>
          <CardHeader><h3 className="font-bold text-slate-800">Desglose por método de pago</h3></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {payments.map(p => (
                <div key={p.method} className="bg-brand-50 rounded-xl p-4 text-center border border-brand-200">
                  <p className="text-[10px] font-mono text-slate-500 uppercase">{p.method}</p>
                  <p className="text-lg font-mono font-black text-brand-700">{formatCurrency(p.amount)}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
