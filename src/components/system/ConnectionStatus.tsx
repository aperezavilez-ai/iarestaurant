import { Wifi, WifiOff } from 'lucide-react'

export function ConnectionStatus({ compact }: { compact?: boolean }) {
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true

  return (
    <span
      className={`flex items-center gap-1 text-xs ${online ? 'text-ops-success' : 'text-ops-danger'} ${compact ? 'text-[10px]' : ''}`}
    >
      {online ? <Wifi size={compact ? 10 : 12} /> : <WifiOff size={compact ? 10 : 12} />}
      {online ? 'En línea' : 'Sin red'}
    </span>
  )
}
