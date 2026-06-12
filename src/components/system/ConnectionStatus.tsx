import { isSupabaseConfigured, getDataMode } from '@/lib/config'
import { Badge } from '@/components/ui/Badge'
import { Wifi, WifiOff, Database } from 'lucide-react'

export function ConnectionStatus({ compact }: { compact?: boolean }) {
  const remote = isSupabaseConfigured()
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true

  if (compact) {
    return (
      <Badge variant={remote ? 'success' : 'warning'} className="gap-1 text-[10px]">
        {remote ? <Database size={10} /> : <WifiOff size={10} />}
        {remote ? 'Supabase' : 'Local'}
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`flex items-center gap-1 ${online ? 'text-ops-success' : 'text-ops-danger'}`}>
        {online ? <Wifi size={12} /> : <WifiOff size={12} />}
        {online ? 'En línea' : 'Sin red'}
      </span>
      <Badge variant={remote ? 'success' : 'amber'} className="gap-1">
        <Database size={10} />
        {getDataMode() === 'remote' ? 'Supabase conectado' : 'Modo demo local'}
      </Badge>
    </div>
  )
}
