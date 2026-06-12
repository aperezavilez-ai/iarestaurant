import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LogOut, Bell } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { CommandNav } from './CommandNav'
import { AICopilot } from '@/components/ai/AICopilot'
import { useAuthStore } from '@/store/authStore'
import { authRepository } from '@/repositories/authRepository'
import { useLiveOps } from '@/hooks/useLiveOps'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ConnectionStatus } from '@/components/system/ConnectionStatus'

const PAGE_META: Record<string, { title: string; zone: string }> = {
  '/app/dashboard': { title: 'Centro de mando', zone: 'COMANDO' },
  '/app/pos': { title: 'Terminal de venta', zone: 'OPERACIÓN' },
  '/app/tables': { title: 'Control de piso', zone: 'PISO' },
  '/app/kitchen': { title: 'Producción', zone: 'COCINA' },
  '/app/catalog': { title: 'Catálogo', zone: 'MENÚ' },
  '/app/cash': { title: 'Caja', zone: 'FINANZAS' },
  '/app/reports': { title: 'Análisis', zone: 'INTELIGENCIA' },
  '/app/users': { title: 'Equipo', zone: 'PERSONAL' },
  '/app/branches': { title: 'Locales', zone: 'RED' },
  '/app/settings': { title: 'Sistema', zone: 'CONFIG' },
}

export function CommandShell() {
  const location = useLocation()
  const { user, tenant, logout } = useAuthStore()
  const { stats, insights } = useLiveOps()
  const [copilotOpen, setCopilotOpen] = useState(true)

  const isKitchen = location.pathname === '/app/kitchen'
  const isPOS = location.pathname === '/app/pos'
  const meta = PAGE_META[location.pathname] || { title: 'IA·RESTAURANT', zone: 'OPS' }
  const showCopilot = !isKitchen

  if (isKitchen) {
    return (
      <div className="h-screen bg-orange-50 overflow-hidden flex flex-col">
        <header className="h-12 px-4 flex items-center justify-between border-b border-orange-200 bg-gradient-to-r from-orange-500 to-brand-500 shrink-0">
          <div className="flex items-center gap-4">
            <Logo size="sm" light />
            <span className="text-xs font-mono text-white/90 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse-live" />
              KDS — Producción
            </span>
          </div>
          <CommandNav compact light />
          <span className="text-xs font-mono text-white/80">{tenant?.name}</span>
        </header>
        <main className="flex-1 overflow-hidden p-4 bg-orange-50">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen bg-command-bg ops-grid-bg overflow-hidden flex flex-col">
      <header className="shrink-0 glass-warm">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <Logo size="sm" showTagline />
          <div className="hidden lg:flex items-center gap-3 text-xs">
            {stats && (
              <>
                <KPI label="Ventas hoy" value={formatCurrency(stats.today_sales)} accent />
                <KPI label="Mesas" value={`${stats.active_tables}/${stats.total_tables}`} />
                <KPI label="Órdenes" value={String(stats.pending_orders)} warn={stats.pending_orders > 2} />
                <KPI label="Ticket" value={formatCurrency(stats.avg_ticket)} />
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ConnectionStatus />
            </div>
            <button className="p-2 rounded-lg hover:bg-brand-50 text-slate-500 relative">
              <Bell size={16} />
              {insights.some(i => i.type === 'alert') && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-ops-danger rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-command-border">
              <div className="w-8 h-8 rounded-full gradient-amber flex items-center justify-center text-white font-bold text-xs shadow-glow">
                {user?.full_name?.[0]?.toUpperCase()}
              </div>
              <button
                onClick={() => { authRepository.signOut(); logout() }}
                className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-ops-danger transition-colors"
                title="Salir"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="px-4 pb-3">
          <CommandNav />
        </div>
      </header>

      <div className={cn(
        'shrink-0 px-6 py-3 border-b border-command-border flex items-center justify-between',
        isPOS ? 'bg-white' : 'bg-command-bg/80'
      )}>
        <div>
          <p className="text-[10px] font-mono text-orange-600 uppercase tracking-[0.2em]">{meta.zone}</p>
          <h1 className="text-xl font-black text-slate-800">{meta.title}</h1>
        </div>
        {isPOS && stats && (
          <p className="text-xs font-mono text-slate-500">
            Folio · <span className="text-brand-600 font-bold">AUTO</span>
          </p>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <main className={cn('flex-1 overflow-y-auto', isPOS ? 'p-0' : 'p-6')}>
          <Outlet />
        </main>
        {showCopilot && (
          copilotOpen
            ? <AICopilot insights={insights} onToggle={() => setCopilotOpen(false)} />
            : <AICopilot insights={insights} collapsed onToggle={() => setCopilotOpen(true)} />
        )}
      </div>
    </div>
  )
}

function KPI({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="text-center px-3 py-1.5 rounded-xl bg-white border border-command-border shadow-card">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={cn(
        'font-mono font-bold text-sm',
        warn ? 'text-ops-danger' : accent ? 'text-brand-600' : 'text-slate-700'
      )}>
        {value}
      </p>
    </div>
  )
}
