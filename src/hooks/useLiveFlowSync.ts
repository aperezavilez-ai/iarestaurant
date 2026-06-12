import { useEffect } from 'react'
import { useLiveFlowStore } from '@/store/liveFlowStore'
import { isSupabaseConfigured } from '@/lib/config'

/** Re-suscribe el componente cuando otra pestaña PWA actualiza el flujo QR (modo local) */
export function useLiveFlowSync(intervalMs = 2000) {
  const qrOrders = useLiveFlowStore(s => s.qrOrders)
  const waiterAlerts = useLiveFlowStore(s => s.waiterAlerts)
  const validationMode = useLiveFlowStore(s => s.validationMode)

  useEffect(() => {
    if (isSupabaseConfigured()) return
    const tick = () => useLiveFlowStore.persist.rehydrate()
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return { qrOrders, waiterAlerts, validationMode, pending: qrOrders.filter(o => o.status === 'enviado') }
}
