import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ModuleLayoutProps {
  phase: number | string
  title: string
  description: string
  children: ReactNode
  actions?: ReactNode
  stats?: { label: string; value: string; color?: string }[]
}

export function ModuleLayout({ phase, title, description, children, actions, stats }: ModuleLayoutProps) {
  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="amber">Fase {phase}</Badge>
            <Badge variant="success">Modo Demo</Badge>
          </div>
          <h2 className="text-2xl font-black text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">{description}</p>
        </div>
        {actions}
      </div>
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="glass-panel rounded-xl p-4 bg-white border border-command-border">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p className={cn('text-xl font-black font-mono mt-1', s.color || 'text-slate-800')}>{s.value}</p>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}
