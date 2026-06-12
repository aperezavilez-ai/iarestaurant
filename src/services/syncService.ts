import { isSupabaseConfigured } from '@/lib/config'
import { localDb } from '@/lib/localDb'
import { supabase } from '@/lib/supabase'

export const syncService = {
  async processQueue(): Promise<{ synced: number; failed: number }> {
    if (!isSupabaseConfigured() || !navigator.onLine) return { synced: 0, failed: 0 }

    const queue = await localDb.getSyncQueue()
    let synced = 0
    let failed = 0

    for (const item of queue) {
      try {
        const { table, operation, payload } = item
        if (operation === 'insert') {
          const { error } = await supabase.from(table).insert(payload)
          if (error) throw error
        } else if (operation === 'update') {
          const { error } = await supabase.from(table).update(payload).eq('id', payload.id as string)
          if (error) throw error
        }
        await localDb.removeSyncItem(item.id)
        synced++
      } catch {
        failed++
      }
    }
    return { synced, failed }
  },

  startAutoSync(intervalMs = 30000) {
    const run = () => this.processQueue().catch(() => {})
    run()
    return setInterval(run, intervalMs)
  },
}
