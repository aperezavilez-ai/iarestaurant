import { supabase } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/config'
import type { RealtimeChannel } from '@supabase/supabase-js'

type ChangeHandler = (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void

const channels: RealtimeChannel[] = []

export const realtimeService = {
  isAvailable: () => isSupabaseConfigured(),

  subscribe(
    table: string,
    filter: string,
    onChange: ChangeHandler
  ): () => void {
    if (!isSupabaseConfigured()) return () => {}

    const channel = supabase
      .channel(`${table}-${filter}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        (payload) => {
          onChange({
            eventType: payload.eventType,
            new: (payload.new || {}) as Record<string, unknown>,
            old: (payload.old || {}) as Record<string, unknown>,
          })
        }
      )
      .subscribe()

    channels.push(channel)

    return () => {
      supabase.removeChannel(channel)
      const idx = channels.indexOf(channel)
      if (idx >= 0) channels.splice(idx, 1)
    }
  },

  subscribeTenant(tenantId: string, table: string, onChange: ChangeHandler): () => void {
    return this.subscribe(table, `tenant_id=eq.${tenantId}`, onChange)
  },

  unsubscribeAll() {
    channels.forEach(ch => supabase.removeChannel(ch))
    channels.length = 0
  },
}
