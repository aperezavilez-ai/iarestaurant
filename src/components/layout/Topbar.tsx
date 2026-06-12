import { Bell, Search, Wifi, WifiOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

export function Topbar() {
  const { user, tenant } = useAuthStore()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(timer)
    }
  }, [])

  return (
    <header className="h-14 border-b border-restaurant-border bg-restaurant-surface flex items-center px-4 gap-4">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar..." className="pl-9 h-8 text-sm" />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Connection status */}
        <div className={`flex items-center gap-1.5 text-xs ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span className="hidden sm:inline">{isOnline ? 'En línea' : 'Sin conexión'}</span>
        </div>

        {/* Branch */}
        {tenant && (
          <Badge variant="default" className="text-xs hidden md:flex">
            {tenant.name}
          </Badge>
        )}

        {/* Date/Time */}
        <span className="text-xs text-muted-foreground hidden lg:block">
          {formatDate(now)} — {now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        </span>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
          <Bell size={15} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-gold rounded-full" />
        </Button>

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}
