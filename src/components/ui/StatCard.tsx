import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  color?: 'amber' | 'ai' | 'success' | 'danger' | 'info'
  className?: string
}

export function StatCard({ label, value, icon: Icon, trend, color = 'amber', className }: StatCardProps) {
  const colors = {
    amber: 'bg-brand-100 text-brand-600 border-brand-200',
    ai: 'bg-sky-100 text-ai-600 border-sky-200',
    success: 'bg-green-100 text-ops-success border-green-200',
    danger: 'bg-red-100 text-ops-danger border-red-200',
    info: 'bg-blue-100 text-ops-info border-blue-200',
  }
  return (
    <div className={cn('glass-panel rounded-2xl p-5 border bg-white', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-slate-800 mt-2 font-mono">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-2 font-mono', trend.positive ? 'text-ops-success' : 'text-ops-danger')}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl border', colors[color])}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}
