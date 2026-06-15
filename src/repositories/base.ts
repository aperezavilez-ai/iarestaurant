import { isSupabaseConfigured } from '@/lib/config'
import { withTimeout } from '@/lib/async'
import { localDb } from '@/lib/localDb'

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export async function withLocalFirst<T>(
  localFn: () => Promise<T>,
  remoteFn?: () => Promise<T>,
  timeoutMs = 6000
): Promise<T> {
  if (isSupabaseConfigured() && isOnline() && remoteFn) {
    try {
      const remote = await withTimeout(remoteFn(), timeoutMs)
      return remote
    } catch {
      return localFn()
    }
  }
  return localFn()
}

/** Fusiona IndexedDB + remoto en paralelo (evita pantallas vacías) */
export async function withHybridList<T extends { id: string }>(
  localFn: () => Promise<T[]>,
  remoteFn?: () => Promise<T[]>
): Promise<T[]> {
  if (!isSupabaseConfigured() || !isOnline() || !remoteFn) {
    return localFn()
  }
  const [local, remote] = await Promise.all([
    localFn(),
    remoteFn().catch(() => [] as T[]),
  ])
  const map = new Map<string, T>()
  for (const item of local) map.set(item.id, item)
  for (const item of remote) map.set(item.id, item)
  return Array.from(map.values())
}

export async function writeLocalFirst<T extends { id: string }>(
  entity: T,
  store: 'products' | 'tables' | 'orders' | 'cash_registers',
  saveFn: (e: T) => Promise<void>,
  syncTable: string,
  operation: 'insert' | 'update' = 'insert'
): Promise<T> {
  await saveFn(entity)
  if (isSupabaseConfigured()) {
    await localDb.enqueueSync({
      table: syncTable,
      operation,
      payload: entity as unknown as Record<string, unknown>,
    })
  }
  return entity
}

export { localDb }
