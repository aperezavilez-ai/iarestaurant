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
}

export function Modal({ open, onClose, title, children, size = 'md', dark }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-7xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative rounded-2xl shadow-panel w-full border',
        sizes[size],
        dark ? 'bg-command-surface border-command-border' : 'bg-white border-slate-200'
      )}>
        {title && (
          <div className={cn('flex items-center justify-between p-5 border-b', dark ? 'border-command-border' : 'border-slate-200')}>
            <h3 className={cn('text-lg font-bold', dark ? 'text-white' : 'text-slate-900')}>{title}</h3>
            <button onClick={onClose} className={cn('p-1.5 rounded-lg transition-colors', dark ? 'hover:bg-command-elevated text-slate-500' : 'hover:bg-slate-100')}>
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  )
}
