import { useRealtimeBootstrap } from '@/hooks/useRealtimeBootstrap'

/** Activa Realtime + hidratación remota del flujo QR cuando Supabase está configurado */
export function RealtimeBootstrap() {
  useRealtimeBootstrap()
  return null
}
