import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, DollarSign, Unlock, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { useTenantContext } from '@/hooks/useTenantContext'
import { cashRepository } from '@/repositories/cashRepository'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { CashRegister } from '@/types'

interface ShiftOpenGateProps {
  open: boolean
  staleRegister?: CashRegister | null
  onOpened: () => void
}

function toDatetimeLocalValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function ShiftOpenGate({ open, staleRegister, onOpened }: ShiftOpenGateProps) {
  const ctx = useTenantContext()
  const { user, tenant } = useAuthStore()
  const navigate = useNavigate()
  const [openingAmount, setOpeningAmount] = useState('2000')
  const [openedAtLocal, setOpenedAtLocal] = useState(toDatetimeLocalValue())
  const [loading, setLoading] = useState(false)

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ctx) return
    const amount = Number(openingAmount)
    if (Number.isNaN(amount) || amount < 0) {
      toast('Indica un fondo de apertura válido', 'error')
      return
    }
    const openedAt = new Date(openedAtLocal)
    if (Number.isNaN(openedAt.getTime())) {
      toast('Hora de apertura no válida', 'error')
      return
    }

    setLoading(true)
    try {
      await cashRepository.openRegister(ctx, amount, openedAt.toISOString())
      toast(`Turno abierto · fondo ${formatCurrency(amount)}`, 'success')
      onOpened()
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo abrir el turno', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (staleRegister) {
    return (
      <Modal open={open} onClose={() => {}} title="Turno anterior sin cerrar" size="sm" blocking>
        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-ops-warning/40 bg-amber-50 p-4 flex gap-3">
            <AlertTriangle size={20} className="text-ops-warning shrink-0 mt-0.5" />
            <div className="text-sm text-slate-700 space-y-1">
              <p>Hay un turno abierto desde <strong>{formatDate(staleRegister.opened_at)}</strong>.</p>
              <p>Debes hacer <strong>Corte Z</strong> antes de abrir el turno de hoy.</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Fondo registrado: {formatCurrency(staleRegister.opening_amount)}
          </p>
          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate('/app/cash/shift', { replace: true })}
          >
            Ir a cerrar turno (Corte Z)
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={() => {}} title="Apertura de turno" size="sm" blocking>
      <form onSubmit={handleOpen} className="p-5 space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Antes de operar {tenant?.name || 'el restaurante'}, registra la apertura de caja del turno.
        </p>

        <div className="rounded-xl bg-slate-50 border border-command-border p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <User size={14} />
            <span>Cajero:</span>
            <span className="font-bold">{user?.full_name}</span>
          </div>
        </div>

        <Input
          label="Hora de apertura"
          type="datetime-local"
          value={openedAtLocal}
          onChange={e => setOpenedAtLocal(e.target.value)}
          icon={<Clock size={15} />}
          required
        />

        <Input
          label="Efectivo en caja (fondo inicial)"
          type="number"
          min={0}
          step="0.01"
          value={openingAmount}
          onChange={e => setOpeningAmount(e.target.value)}
          icon={<DollarSign size={15} />}
          required
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          <Unlock size={16} /> Iniciar turno y entrar
        </Button>

        <p className="text-[10px] text-slate-500 text-center">
          El POS y cobros quedan habilitados al confirmar la apertura.
        </p>
      </form>
    </Modal>
  )
}
