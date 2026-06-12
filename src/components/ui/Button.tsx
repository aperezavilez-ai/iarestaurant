import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'ai'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
      primary: 'gradient-amber text-white hover:opacity-90 focus:ring-brand-500 shadow-glow',
      secondary: 'bg-command-elevated hover:bg-command-card text-slate-700 border border-command-border focus:ring-brand-300',
      ghost: 'bg-transparent hover:bg-brand-50 text-slate-600 hover:text-brand-700 focus:ring-brand-300',
      danger: 'bg-ops-danger hover:bg-red-700 text-white focus:ring-ops-danger',
      outline: 'border-2 border-brand-500 text-brand-600 hover:bg-brand-50 focus:ring-brand-500',
      ai: 'gradient-ai text-white hover:opacity-90 focus:ring-ai-500',
    }
    const sizes = {
      sm: 'px-3 py-2 text-xs gap-1.5 min-h-[36px]',
      md: 'px-4 py-2.5 text-sm gap-2 min-h-[40px]',
      lg: 'px-5 py-3 text-base gap-2 min-h-[48px]',
      xl: 'px-6 py-3.5 text-lg gap-2.5 min-h-[52px]',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
