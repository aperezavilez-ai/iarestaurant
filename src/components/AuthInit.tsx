import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authRepository } from '@/repositories/authRepository'
import { localDb } from '@/lib/localDb'
import { syncService } from '@/services/syncService'
import { bootstrapService } from '@/services/bootstrapService'
import { isSupabaseConfigured } from '@/lib/config'
import { withTimeout } from '@/lib/async'
import { SEED_SUCURSAL } from '@/data/seed'
import { Logo } from '@/components/brand/Logo'
import { Loader2 } from 'lucide-react'

export function AuthInit({ children }: { children: React.ReactNode }) {
  const { isLoading, setLoading, setSession, logout } = useAuthStore()

  useEffect(() => {
    let syncTimer: ReturnType<typeof setInterval> | undefined

    async function init() {
      try {
        await localDb.ensureLocalSeed()

        let restored = null
        try {
          restored = await withTimeout(authRepository.restoreSession(), 8000)
        } catch {
          restored = null
        }

        const state = useAuthStore.getState()

        if (restored) {
          setSession(restored)
          if (isSupabaseConfigured()) {
            void bootstrapService.pullFromRemote({
              tenantId: restored.tenant.id,
              sucursalId: restored.sucursal.id,
              userId: restored.user.id,
            })
          }
        } else if (state.user && state.tenant) {
          setSession({
            user: state.user,
            tenant: state.tenant,
            sucursal: state.sucursal || SEED_SUCURSAL,
          })
        } else {
          logout()
        }
      } finally {
        setLoading(false)
        if (isSupabaseConfigured()) {
          syncTimer = syncService.startAutoSync()
        }
      }
    }

    init()
    return () => { if (syncTimer) clearInterval(syncTimer) }
  }, [logout, setLoading, setSession])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-command-bg ops-grid-bg flex flex-col items-center justify-center gap-6">
        <Logo size="lg" showTagline />
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
          <span className="text-sm font-mono">Inicializando sistema...</span>
        </div>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          Conectando servicios…
        </p>
      </div>
    )
  }

  return <>{children}</>
}
