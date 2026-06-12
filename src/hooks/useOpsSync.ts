import { useEffect } from 'react'
import { opsBroadcast } from '@/services/opsBroadcast'

/** Re-sincroniza cuando POS, Piso o Cocina actualizan órdenes/mesas en otra pestaña */
export function useOpsSync(onSync: () => void, intervalMs = 5000) {
  useEffect(() => {
    const unsub = opsBroadcast.subscribe(onSync)
    const poll = setInterval(onSync, intervalMs)
    return () => {
      unsub()
      clearInterval(poll)
    }
  }, [onSync, intervalMs])
}
