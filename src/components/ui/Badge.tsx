import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'amber' | 'ai'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-command-elevated text-slate-600 border-command-border',
    success: 'bg-green-100 text-ops-success border-green-200',
    warning: 'bg-amber-100 text-ops-warning border-amber-200',
    danger: 'bg-red-100 text-ops-danger border-red-200',
    info: 'bg-blue-100 text-ops-info border-blue-200',
    amber: 'bg-brand-100 text-brand-700 border-brand-300',
    ai: 'bg-sky-100 text-ai-600 border-sky-200',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border', variants[variant], className)}>
      {children}
    </span>
  )
}
