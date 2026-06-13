import { useLiveFlowSync } from '@/hooks/useLiveFlowSync'
import { useLiveFlowStore } from '@/store/liveFlowStore'
import { QRValidationPanel } from '@/components/qr/QRValidationPanel'
import { Badge } from '@/components/ui/Badge'
import { PwaBackLink } from '@/components/layout/PageBack'
import { Vault, Settings } from 'lucide-react'

export default function CajaPWA() {
  const { pending, validationMode } = useLiveFlowSync(1500)
  const setValidationMode = useLiveFlowStore(s => s.setValidationMode)

  return (
    <div className="min-h-screen bg-command-bg max-w-lg mx-auto">
      <header className="bg-white border-b border-command-border p-4 sticky top-0 z-10">
        <PwaBackLink className="mb-2" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vault size={20} className="text-brand-600" />
            <div>
              <p className="text-[10px] font-mono text-orange-600 uppercase">PWA Caja</p>
              <p className="font-black text-lg text-slate-800">Validación QR</p>
            </div>
          </div>
          {pending.length > 0 && <Badge variant="danger" className="animate-pulse-live">{pending.length} QR</Badge>}
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl border border-command-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings size={16} className="text-slate-500" />
            <p className="text-sm font-semibold text-slate-700">Modo de validación</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setValidationMode('validacion')}
              className={`p-3 rounded-xl border text-sm font-bold transition-all ${validationMode === 'validacion' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 text-slate-500'}`}
            >
              Caja valida
            </button>
            <button
              onClick={() => setValidationMode('automatico')}
              className={`p-3 rounded-xl border text-sm font-bold transition-all ${validationMode === 'automatico' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 text-slate-500'}`}
            >
              Automático
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {validationMode === 'validacion'
              ? 'El comensal envía → Caja aprueba → Cocina + Mesero alerta'
              : 'El comensal envía → Directo a cocina + Mesero alerta'}
          </p>
        </div>

        <QRValidationPanel />
      </div>
    </div>
  )
}
