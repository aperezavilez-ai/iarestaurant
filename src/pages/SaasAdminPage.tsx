import { useEffect, useState } from 'react'
import { Cloud, Building2, Monitor, Power, PowerOff } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { securityRepository } from '@/repositories/securityRepository'
import { getTenantDeviceLimit, PLAN_DEVICE_LIMITS } from '@/config/deviceLimits'
import type { Tenant } from '@/types'
import { Navigate } from 'react-router-dom'

export default function SaasAdminPage() {
  const { user } = useAuthStore()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await securityRepository.listAllTenants()
      setTenants(list)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al cargar tenants', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin_saas') load()
  }, [user?.role])

  const toggleActive = async (t: Tenant) => {
    try {
      await securityRepository.setTenantActive(t.id, !t.is_active)
      toast(t.is_active ? 'Restaurante suspendido' : 'Restaurante reactivado', 'success')
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  if (user?.role !== 'admin_saas') {
    return <Navigate to="/app/dashboard" replace />
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Cloud size={20} className="text-brand-600" />
            <div>
              <h3 className="font-bold text-slate-800">Panel SaaS — IA·RESTAURANT</h3>
              <p className="text-xs text-slate-500">Licencias, restaurantes y límites de equipos</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs">
            {Object.entries(PLAN_DEVICE_LIMITS).map(([plan, n]) => (
              <div key={plan} className="rounded-xl border border-command-border p-3">
                <p className="text-slate-500 uppercase">{plan}</p>
                <p className="font-black text-brand-600 flex items-center justify-center gap-1 mt-1">
                  <Monitor size={14} /> {n} equipos
                </p>
              </div>
            ))}
          </div>

          {loading && tenants.length === 0 ? (
            <p className="text-sm text-slate-500">Cargando restaurantes...</p>
          ) : (
            <div className="space-y-2">
              {tenants.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-command-border bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <Building2 size={18} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {t.plan} · máx {getTenantDeviceLimit(t)} equipos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={t.is_active ? 'success' : 'danger'}>
                      {t.is_active ? 'Activo' : 'Suspendido'}
                    </Badge>
                    <Button
                      size="sm"
                      variant={t.is_active ? 'outline' : 'primary'}
                      onClick={() => toggleActive(t)}
                    >
                      {t.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                      {t.is_active ? 'Suspender' : 'Activar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
