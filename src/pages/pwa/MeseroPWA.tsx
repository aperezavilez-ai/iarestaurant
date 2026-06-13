import { useLiveFlowSync } from '@/hooks/useLiveFlowSync'
import { PwaBackLink } from '@/components/layout/PageBack'
import { useLiveFlowStore } from '@/store/liveFlowStore'
import { Bell, CheckCircle, Clock, Users, QrCode, Volume2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { SEED_TABLES } from '@/data/seed'

const ALERT_STYLE: Record<string, string> = {
  nuevo_pedido_qr: 'bg-orange-50 border-orange-300',
  pedido_validado: 'bg-green-50 border-green-300',
  pedido_listo: 'bg-emerald-50 border-emerald-400',
  solicitud_ayuda: 'bg-red-50 border-red-300',
  solicitud_cuenta: 'bg-amber-50 border-amber-300',
  solicitud_servicio: 'bg-blue-50 border-blue-300',
}

export default function MeseroPWA() {
  const { waiterAlerts, qrOrders } = useLiveFlowSync(1500)
  const dismissAlert = useLiveFlowStore(s => s.dismissAlert)

  const unread = waiterAlerts.filter(a => !a.read)
  const myTables = SEED_TABLES.filter(t => t.number <= 12).slice(0, 5)

  const getTableQRStatus = (num: number) => {
    const order = qrOrders.find(o => o.table_number === num && !['entregado', 'rechazado'].includes(o.status))
    return order?.status
  }

  return (
    <div className="min-h-screen bg-command-bg max-w-md mx-auto">
      <header className="bg-white border-b border-command-border p-4 sticky top-0 z-10">
        <PwaBackLink className="mb-2" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-orange-600 uppercase">Mesero</p>
            <p className="font-black text-lg text-slate-800">Mesero Demo</p>
            <p className="text-xs text-slate-500">Salón + Terraza · 5 mesas</p>
          </div>
          {unread.length > 0 && (
            <div className="flex items-center gap-1 text-ops-danger animate-pulse">
              <Volume2 size={16} />
              <span className="font-bold text-sm">{unread.length}</span>
            </div>
          )}
        </div>
      </header>

      {unread.length > 0 && (
        <div className="p-4 space-y-2">
          <p className="text-[10px] font-mono text-ops-danger uppercase flex items-center gap-1">
            <Bell size={12} className="animate-pulse" /> Alertas en vivo
          </p>
          {unread.map(alert => (
            <div key={alert.id} className={cn('border-2 rounded-xl p-3 flex justify-between items-center', ALERT_STYLE[alert.type] || 'bg-white border-gray-200')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {alert.type.includes('qr') && <QrCode size={14} className="text-orange-600 shrink-0" />}
                  <p className="font-bold text-sm">Mesa {alert.table_number}</p>
                  <Badge variant="amber" className="text-[8px]">NUEVO</Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(alert.created_at).toLocaleTimeString('es-MX')}</p>
              </div>
              <Button size="sm" onClick={() => { dismissAlert(alert.id); toast('Atendido', 'success') }}>OK</Button>
            </div>
          ))}
        </div>
      )}

      <div className="p-4">
        <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">Mis mesas</p>
        <div className="space-y-3">
          {myTables.map(t => {
            const qrStatus = getTableQRStatus(t.number)
            return (
              <div key={t.id} className="bg-white rounded-xl border border-command-border p-4 shadow-card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-2xl font-black text-slate-800">{t.number}</p>
                    <Badge variant={t.status === 'cobro_pendiente' ? 'warning' : t.status === 'ocupada' ? 'danger' : 'success'} className="mt-1 capitalize">
                      {t.status.replace('_', ' ')}
                    </Badge>
                    {qrStatus && (
                      <Badge variant="amber" className="mt-1 ml-1 gap-1">
                        <QrCode size={10} /> QR: {qrStatus.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="flex items-center gap-1 justify-end"><Users size={10} />{t.capacity} pax</p>
                    {t.opened_at && (
                      <p className="flex items-center gap-1 justify-end mt-1"><Clock size={10} />
                        {Math.floor((Date.now() - new Date(t.opened_at).getTime()) / 60000)}m
                      </p>
                    )}
                  </div>
                </div>
                {qrStatus === 'listo' && (
                  <div className="mt-3 flex items-center gap-2 text-ops-success text-sm font-bold">
                    <CheckCircle size={16} /> Pedido QR listo — llevar a mesa
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
