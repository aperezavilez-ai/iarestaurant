import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  endIcon?: React.ReactNode
  onEndIconClick?: () => void
  endIconLabel?: string
  dark?: boolean
  /** Teclado numérico en móvil + evita zoom iOS */
  numeric?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, icon, endIcon, onEndIconClick, endIconLabel, dark, id, numeric, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const isNumeric = numeric || type === 'number'
    const field = (
      <div className="relative">
        {icon && (
          <span className={cn('absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none', dark ? 'text-slate-500' : 'text-slate-400')}>
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          inputMode={isNumeric ? 'decimal' : props.inputMode}
          enterKeyHint={isNumeric ? 'done' : props.enterKeyHint}
          className={cn(
            'flex h-11 w-full rounded-xl px-3 py-2 transition-colors',
            isNumeric ? 'text-base sm:text-sm ticket-mono' : 'text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            dark
              ? 'bg-command-bg border border-command-border text-white placeholder:text-slate-600 focus:border-brand-500/50'
              : 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400',
            icon && 'pl-10',
            endIcon && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {endIcon && (
          <button
            type="button"
            onClick={onEndIconClick}
            aria-label={endIconLabel}
            className={cn('absolute right-3 top-1/2 -translate-y-1/2 transition-colors', dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}
          >
            {endIcon}
          </button>
        )}
      </div>
    )

    if (!label) return field

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className={cn('text-sm font-medium', dark ? 'text-slate-400' : 'text-slate-700')}>
          {label}
        </label>
        {field}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
