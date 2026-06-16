import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  dark?: boolean
  /** Sin cerrar con clic fuera ni botón X */
  blocking?: boolean
}

export function Modal({ open, onClose, title, children, size = 'md', dark, blocking }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-7xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={blocking ? undefined : onClose}
        aria-hidden
      />
      <div
        className={cn(
          'relative w-full shadow-panel border max-h-[92dvh] sm:max-h-[85vh] flex flex-col',
          'rounded-t-2xl sm:rounded-2xl mobile-modal-sheet',
          sizes[size],
          dark ? 'bg-command-surface border-command-border' : 'bg-white border-slate-200'
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className={cn(
            'flex items-center justify-between p-4 sm:p-5 border-b shrink-0',
            dark ? 'border-command-border' : 'border-slate-200'
          )}>
            <h3 className={cn('text-lg font-bold pr-2', dark ? 'text-white' : 'text-slate-900')}>{title}</h3>
            {!blocking && (
              <button
                onClick={onClose}
                className={cn(
                  'p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center',
                  dark ? 'hover:bg-command-elevated text-slate-500' : 'hover:bg-slate-100'
                )}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain">{children}</div>
      </div>
    </div>
  )
}
