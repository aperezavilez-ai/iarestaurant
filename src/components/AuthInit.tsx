import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authRepository } from '@/repositories/authRepository'
import { localDb } from '@/lib/localDb'
import { syncService } from '@/services/syncService'
import { bootstrapService } from '@/services/bootstrapService'
import { isSupabaseConfigured, getDataMode } from '@/lib/config'
import { SEED_SUCURSAL } from '@/data/seed'
import { Logo } from '@/components/brand/Logo'
import { Loader2 } from 'lucide-react'

export function AuthInit({ children }: { children: React.ReactNode }) {
  const { isLoading, setLoading, setSession, logout } = useAuthStore()

  useEffect(() => {
    let syncTimer: ReturnType<typeof setInterval> | undefined

    async function init() {
      await localDb.ensureLocalSeed()
      const restored = await authRepository.restoreSession()
      const state = useAuthStore.getState()

      if (restored) {
        setSession(restored)
        if (isSupabaseConfigured()) {
          await bootstrapService.pullFromRemote({
            tenantId: restored.tenant.id,
            sucursalId: restored.sucursal.id,
            userId: restored.user.id,
          })
        }
      } else if (state.user && state.tenant) {
        if (!state.sucursal) {
          setSession({ user: state.user, tenant: state.tenant, sucursal: SEED_SUCURSAL })
        }
      } else {
        logout()
      }
      setLoading(false)
      if (isSupabaseConfigured()) {
        syncTimer = syncService.startAutoSync()
      }
    }

    init()
    return () => { if (syncTimer) clearInterval(syncTimer) }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-command-bg ops-grid-bg flex flex-col items-center justify-center gap-6">
        <Logo size="lg" showTagline />
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
          <span className="text-sm font-mono">Inicializando sistema...</span>
        </div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          {getDataMode() === 'local' ? 'Modo local' : 'Supabase conectado'}
        </p>
      </div>
    )
  }

  return <>{children}</>
}
