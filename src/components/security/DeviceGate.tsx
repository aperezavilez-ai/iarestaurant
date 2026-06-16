import { useEffect, useState, useCallback } from 'react'
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
    body: 'Este dispositivo fue registrado pero aún no está aprobado. Pide al administrador del restaurante que lo autorice en Configuración → Equipos autorizados.',
  },
  device_revoked: {
    title: 'Equipo no autorizado',
    body: 'Este equipo fue revocado. Usa un dispositivo aprobado o solicita nueva autorización al administrador.',
  },
  device_limit: {
    title: 'Límite de equipos',
    body: 'Se alcanzó el máximo de equipos del plan. Revoca uno existente o contacta soporte para ampliar tu licencia.',
  },
}

export function DeviceGate({ children }: { children: React.ReactNode }) {
  const { user, tenant, sucursal, isAuthenticated, logout } = useAuthStore()
  const [checking, setChecking] = useState(true)
  const [blockReason, setBlockReason] = useState<SecurityBlockReason | null>(null)

  const verify = useCallback(async () => {
    if (!isAuthenticated || !user || !tenant || !sucursal) {
      setBlockReason(null)
      setChecking(false)
      return
    }
    setChecking(true)
    try {
      await securityRepository.enforceDeviceAccess({ user, tenant, sucursal })
      setBlockReason(null)
    } catch (e) {
      if (e instanceof SecurityAccessError) {
        setBlockReason(e.reason)
      } else {
        console.warn('[security] verificación omitida:', e)
        setBlockReason(null)
      }
    } finally {
      setChecking(false)
    }
  }, [isAuthenticated, user, tenant, sucursal])

  useEffect(() => {
    verify()
  }, [verify])

  if (checking) {
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
            <Button variant="outline" className="flex-1" onClick={verify}>
              Reintentar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => { authRepository.signOut(); logout() }}
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
