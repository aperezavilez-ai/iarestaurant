import { useEffect, useState } from 'react'
import { Monitor, Check, Ban, Clock } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'
import { useTenantContext } from '@/hooks/useTenantContext'
import { useAuthStore } from '@/store/authStore'
import { securityRepository } from '@/repositories/securityRepository'
import { getTenantDeviceLimit } from '@/config/deviceLimits'
import type { TenantDevice } from '@/types/security'

export function AuthorizedDevicesPanel() {
  const ctx = useTenantContext()
  const { user, tenant } = useAuthStore()
  const [devices, setDevices] = useState<TenantDevice[]>([])
  const [loading, setLoading] = useState(false)

  const canManage = user?.role === 'admin_restaurant' || user?.role === 'gerente' || user?.role === 'admin_saas'
  const limit = tenant ? getTenantDeviceLimit(tenant) : 0
  const active = devices.filter(d => d.status !== 'revoked').length

  const load = async () => {
    if (!ctx) return
    const list = await securityRepository.listDevices(ctx.tenantId)
    setDevices(list)
  }

  useEffect(() => { load() }, [ctx])

  const approve = async (id: string) => {
    if (!user) return
    setLoading(true)
    try {
      await securityRepository.approveDevice(id, user.id)
      toast('Equipo autorizado', 'success')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al aprobar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const revoke = async (id: string) => {
    setLoading(true)
    try {
      await securityRepository.revokeDevice(id)
      toast('Equipo revocado', 'success')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al revocar', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!canManage) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Monitor size={18} className="text-brand-600" />
            <h3 className="font-bold text-slate-800">Equipos autorizados</h3>
          </div>
          <Badge variant="info">{active}/{limit}</Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-2">
        <p className="text-xs text-slate-500 mb-3">
          Solo los equipos aprobados pueden operar el sistema. Los nuevos quedan pendientes hasta que los autorices.
        </p>
        {devices.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Sin equipos registrados</p>
        ) : devices.map(d => (
          <div key={d.id} className="flex items-center justify-between gap-2 p-3 rounded-xl border border-command-border bg-slate-50">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{d.device_label}</p>
              <p className="text-[10px] text-slate-500">
                Último acceso {new Date(d.last_seen_at).toLocaleString('es-MX')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={d.status === 'approved' ? 'success' : d.status === 'pending' ? 'warning' : 'danger'}>
                {d.status === 'approved' ? 'Activo' : d.status === 'pending' ? 'Pendiente' : 'Revocado'}
              </Badge>
              {d.status === 'pending' && (
                <Button size="sm" loading={loading} onClick={() => approve(d.id)}>
                  <Check size={14} />
                </Button>
              )}
              {d.status !== 'revoked' && (
                <Button size="sm" variant="outline" loading={loading} onClick={() => revoke(d.id)}>
                  <Ban size={14} />
                </Button>
              )}
            </div>
          </div>
        ))}
        {devices.some(d => d.status === 'pending') && (
          <p className="text-xs text-amber-700 flex items-center gap-1 pt-2">
            <Clock size={12} /> Hay equipos esperando tu aprobación
          </p>
        )}
      </CardBody>
    </Card>
  )
}
