import { useEffect, useState, useCallback, useRef } from 'react'
import { ShieldAlert, Monitor, LogOut } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { authRepository } from '@/repositories/authRepository'
import { securityRepository } from '@/repositories/securityRepository'
import { SecurityAccessError } from '@/types/security'
import type { SecurityBlockReason } from '@/types/security'

const MESSAGES: Record<SecurityBlockReason, { title: string; body: string }> = {
  tenant_suspended: {
    title: 'Licencia suspendida',
    body: 'El acceso a este restaurante fue suspendido. Contacta a soporte IA·RESTAURANT para reactivar tu plan.',
  },
  device_pending: {
    title: 'Equipo pendiente de autorización',
    body: 'Este dispositivo fue registrado pero aún no está aprobado. Pide al administrador que lo autorice en Seguridad → Equipos.',
  },
  device_revoked: {
    title: 'Equipo no autorizado',
    body: 'Este equipo fue revocado. Usa un dispositivo aprobado o solicita nueva autorización al administrador.',
  },
  device_limit: {
    title: 'Límite de equipos',
    body: 'Se alcanzó el máximo de equipos del plan. Revoca uno existente o contacta soporte para ampliar tu licencia.',
  },
  ip_blocked: {
    title: 'Red no autorizada',
    body: 'Tu IP no está en la lista permitida del restaurante. Conéctate a la red del local o pide al administrador que agregue tu IP en Seguridad.',
  },
}

export function DeviceGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userId = useAuthStore((s) => s.user?.id)
  const tenantId = useAuthStore((s) => s.tenant?.id)
  const sucursalId = useAuthStore((s) => s.sucursal?.id)
  const user = useAuthStore((s) => s.user)
  const tenant = useAuthStore((s) => s.tenant)
  const [initializing, setInitializing] = useState(true)
  const [blockReason, setBlockReason] = useState<SecurityBlockReason | null>(null)
  const verifiedOnceRef = useRef(false)

  const verify = useCallback(async (showLoader: boolean) => {
    const { user: u, tenant: t, sucursal: s, isAuthenticated: authed } = useAuthStore.getState()
    if (!authed || !u || !t || !s) {
      setBlockReason(null)
      if (showLoader) setInitializing(false)
      return
    }
    if (showLoader) setInitializing(true)
    try {
      await securityRepository.enforceDeviceAccess({ user: u, tenant: t, sucursal: s })
      setBlockReason(null)
      verifiedOnceRef.current = true
    } catch (e) {
      if (e instanceof SecurityAccessError) {
        setBlockReason(e.reason)
      } else {
        console.warn('[security] verificación omitida:', e)
        setBlockReason(null)
      }
    } finally {
      if (showLoader) setInitializing(false)
    }
  }, [userId, tenantId, sucursalId, isAuthenticated])

  useEffect(() => {
    void verify(!verifiedOnceRef.current)
  }, [verify])

  if (initializing && !verifiedOnceRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-command-bg">
        <p className="text-sm text-slate-500 font-mono">Verificando licencia y equipo...</p>
      </div>
    )
  }

  if (blockReason) {
    const msg = MESSAGES[blockReason]
    return (
      <Modal open onClose={() => {}} title={msg.title} size="sm" blocking>
        <div className="p-5 space-y-4">
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <ShieldAlert className="text-amber-600 shrink-0" size={22} />
            <p className="text-sm text-slate-700 leading-relaxed">{msg.body}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Monitor size={14} />
            <span>{tenant?.name} · {user?.full_name}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => verify(false)}>
              Reintentar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => { authRepository.signOut(); useAuthStore.getState().logout() }}
            >
              <LogOut size={14} /> Salir
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return <>{children}</>
}
