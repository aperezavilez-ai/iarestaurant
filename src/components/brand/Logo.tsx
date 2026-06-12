import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  className?: string
  light?: boolean
}

export function Logo({ size = 'md', showTagline = false, className, light }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', title: 'text-sm', tag: 'text-[10px]' },
    md: { icon: 'w-10 h-10', title: 'text-lg', tag: 'text-xs' },
    lg: { icon: 'w-14 h-14', title: 'text-2xl', tag: 'text-sm' },
  }
  const s = sizes[size]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(s.icon, 'relative rounded-xl gradient-amber flex items-center justify-center shadow-glow shrink-0')}>
        <svg viewBox="0 0 24 24" className="w-[55%] h-[55%]" fill="none">
          <circle cx="12" cy="12" r="8" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="3" fill="#FFFFFF" />
          <circle cx="18" cy="6" r="2" fill="#FEF3C7" />
          <line x1="14" y1="10" x2="17" y2="7" stroke="#FEF3C7" strokeWidth="1" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className={cn(s.title, 'font-black tracking-tight leading-none')}>
          <span className={light ? 'text-white' : 'text-slate-800'}>IA</span>
          <span className="text-orange-500">·</span>
          <span className={light ? 'text-white' : 'text-slate-800'}>RESTAURANT</span>
        </p>
        {showTagline && (
          <p className={cn(s.tag, 'mt-0.5 tracking-wide uppercase', light ? 'text-orange-100' : 'text-orange-600/70')}>
            Operating System
          </p>
        )}
      </div>
    </div>
  )
}
