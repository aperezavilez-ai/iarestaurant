import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast { id: string; message: string; type: ToastType }

let addToastFn: ((message: string, type: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'info') {
  addToastFn?.(message, type)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const remove = (id: string) => setToasts(t => t.filter(x => x.id !== id))

  addToastFn = useCallback((message: string, type: ToastType) => {
    const id = crypto.randomUUID()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => remove(id), 4000)
  }, [])

  const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info }
  const colors = {
    success: 'bg-ops-success/10 border-ops-success/30 text-ops-success',
    error: 'bg-ops-danger/10 border-ops-danger/30 text-ops-danger',
    warning: 'bg-ops-warning/10 border-ops-warning/30 text-ops-warning',
    info: 'bg-sky-50 border-sky-200 text-ai-600',
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm w-full">
      {toasts.map(t => {
        const Icon = icons[t.type]
        return (
          <div key={t.id} className={cn('flex items-start gap-3 p-4 rounded-xl border shadow-panel bg-white', colors[t.type])}>
            <Icon size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="shrink-0 opacity-60 hover:opacity-100"><X size={16} /></button>
          </div>
        )
      })}
    </div>
  )
}
