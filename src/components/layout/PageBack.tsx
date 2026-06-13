import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageBackProps {
  to: string
  label?: string
  light?: boolean
  className?: string
}

export function PageBack({ to, label = 'Volver', light, className }: PageBackProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all min-h-[40px] border',
        light
          ? 'text-white/95 border-white/30 bg-white/10 hover:bg-white/20'
          : 'text-slate-600 border-command-border bg-white hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50',
        className
      )}
    >
      <ArrowLeft size={16} className="shrink-0" />
      <span className="truncate max-w-[140px] sm:max-w-none">{label}</span>
    </Link>
  )
}

/** Rutas principales del menú superior → vuelven al centro de mando */
const MAIN_APP_ROUTES = new Set([
  '/app/dashboard',
  '/app/pos',
  '/app/tables',
  '/app/kitchen',
  '/app/catalog',
  '/app/cash',
  '/app/reports',
  '/app/users',
  '/app/branches',
  '/app/settings',
])

export function PwaBackLink({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link
      to="/app/dashboard"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-bold',
        light ? 'text-white/90 hover:text-white' : 'text-slate-500 hover:text-brand-600',
        className
      )}
    >
      <ArrowLeft size={14} />
      Panel principal
    </Link>
  )
}

export function getPageBackTarget(pathname: string): { to: string; label: string } | null {
  if (pathname === '/app/dashboard' || pathname === '/app/modules') return null
  if (MAIN_APP_ROUTES.has(pathname)) {
    return { to: '/app/dashboard', label: 'Centro de mando' }
  }
  return { to: '/app/modules', label: 'Todos los módulos' }
}
