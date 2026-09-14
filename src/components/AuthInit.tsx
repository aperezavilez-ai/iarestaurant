import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authRepository } from '@/repositories/authRepository'
import { localDb } from '@/lib/localDb'
import { syncService } from '@/services/syncService'
import { bootstrapService } from '@/services/bootstrapService'
import { isSupabaseConfigured } from '@/lib/config'
import { withTimeout } from '@/lib/async'
import { Logo } from '@/components/brand/Logo'
import { Loader2 } from 'lucide-react'

export function AuthInit({ children }: { children: React.ReactNode }) {
  const { isLoading, setLoading, setSession, logout } = useAuthStore()

  useEffect(() => {
    let syncTimer: ReturnType<typeof setInterval> | undefined

    async function init() {
      try {
        if (!isSupabaseConfigured()) return

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
          void bootstrapService.pullFromRemote({
            tenantId: restored.tenant.id,
            sucursalId: restored.sucursal.id,
            userId: restored.user.id,
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

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-command-bg flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Logo size="md" />
        <h1 className="text-xl font-black text-slate-800">Configuración requerida</h1>
        <p className="text-sm text-slate-500 max-w-md">
          Faltan las variables <code className="text-xs bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> y{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-command-bg ops-grid-bg flex flex-col items-center justify-center gap-6">
        <Logo size="lg" showTagline />
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
          <span className="text-sm font-mono">Inicializando sistema...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
