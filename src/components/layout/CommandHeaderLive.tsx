import { memo } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { useLiveOps } from '@/hooks/useLiveOps'
import { AICopilot } from '@/components/ai/AICopilot'

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

function CommandHeaderKpisInner() {
  const { stats } = useLiveOps()
  if (!stats) return null

  return (
    <>
      <KPI label="Ventas hoy" value={formatCurrency(stats.today_sales)} accent />
      <KPI label="Mesas" value={`${stats.active_tables}/${stats.total_tables}`} />
      <KPI label="Órdenes" value={String(stats.pending_orders)} warn={stats.pending_orders > 2} />
      <KPI label="Ticket" value={formatCurrency(stats.avg_ticket)} />
    </>
  )
}

export const CommandHeaderKpis = memo(CommandHeaderKpisInner)

function CommandCopilotPanelInner({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { insights } = useLiveOps()
  return (
    <AICopilot
      insights={insights}
      collapsed={collapsed}
      onToggle={onToggle}
    />
  )
}

export const CommandCopilotPanel = memo(CommandCopilotPanelInner)
