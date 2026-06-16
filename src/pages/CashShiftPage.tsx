import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CreditCard, Lock, Unlock, DollarSign, FileText, ArrowDown, ArrowUp, Printer, User, Clock,
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PageBack } from '@/components/layout/PageBack'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import { useTenantContext } from '@/hooks/useTenantContext'
import { useAuthStore } from '@/store/authStore'
import { cashRepository } from '@/repositories/cashRepository'
import { useOpsDataStore } from '@/store/opsDataStore'
import { printCashCutTicket, type ShiftSummary } from '@/lib/cashShift'
import type { CashRegister } from '@/types'

const EMPTY_SUMMARY: ShiftSummary = {
  totalSales: 0,
  orderCount: 0,
  byMethod: { efectivo: 0, tarjeta: 0, transferencia: 0, mixto: 0 },
  cashSales: 0,
}

export default function CashShiftPage() {
  const ctx = useTenantContext()
  const { user, tenant, sucursal } = useAuthStore()
  const [register, setRegister] = useState<CashRegister | null>(null)
  const [summary, setSummary] = useState<ShiftSummary>(EMPTY_SUMMARY)
  const [openingAmount, setOpeningAmount] = useState('2000')
  const [closingAmount, setClosingAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [moveModal, setMoveModal] = useState<'entrada' | 'salida' | null>(null)
  const [moveAmount, setMoveAmount] = useState('')
  const [moveNote, setMoveNote] = useState('')
  const [cutModal, setCutModal] = useState(false)
  const [lastCutType, setLastCutType] = useState<'X' | 'Z' | null>(null)

  const cashMovements = useOpsDataStore(s => s.cashMovements)
  const partialCuts = useOpsDataStore(s => s.partialCuts)
  const addCashMovement = useOpsDataStore(s => s.addCashMovement)
  const addPartialCut = useOpsDataStore(s => s.addPartialCut)
  const clearShiftSession = useOpsDataStore(s => s.clearShiftSession)

  const shiftMovements = useMemo(
    () => register
      ? cashMovements.filter(m => !m.register_id || m.register_id === register.id)
      : [],
    [cashMovements, register]
  )

  const movementsNet = shiftMovements.reduce(
    (s, m) => s + (m.type === 'entrada' ? m.amount : -m.amount),
    0
  )

  const expectedCash = register
    ? register.opening_amount + summary.cashSales + movementsNet
    : 0
  const difference = register && closingAmount
    ? Number(closingAmount) - expectedCash
    : 0

  const load = async () => {
    if (!ctx) return
    const reg = await cashRepository.getOpenRegister(ctx)
    setRegister(reg)
    if (reg) {
      const sum = await cashRepository.getShiftSummary(ctx, reg.opened_at)
      setSummary(sum)
    } else {
      setSummary(EMPTY_SUMMARY)
    }
  }

  useEffect(() => { load() }, [ctx])

  const buildPrintData = (type: 'X' | 'Z', counted?: number, diff?: number) => ({
    type,
    tenantName: tenant?.name || 'Restaurante',
    sucursalName: sucursal?.name || 'Sucursal',
    cashierName: user?.full_name || 'Cajero',
    openedAt: register!.opened_at,
    closedAt: type === 'Z' ? new Date().toISOString() : undefined,
    openingAmount: register!.opening_amount,
    totalSales: summary.totalSales,
    orderCount: summary.orderCount,
    cashSales: summary.cashSales,
    cardSales: summary.byMethod.tarjeta,
    digitalSales: summary.byMethod.transferencia,
    movementsNet,
    expectedCash,
    countedCash: counted,
    difference: diff,
    cutNumber: type === 'X' ? partialCuts.length + 1 : undefined,
  })

  const handleOpen = async () => {
    if (!ctx) return
    const amount = Number(openingAmount)
    if (!amount || amount < 0) {
      toast('Indica un fondo de apertura válido', 'error')
      return
    }
    setLoading(true)
    try {
      const reg = await cashRepository.openRegister(ctx, amount)
      setRegister(reg)
      setSummary(EMPTY_SUMMARY)
      toast('Turno abierto — ya puedes cobrar en POS', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al abrir turno', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    if (!ctx || !register) return
    setLoading(true)
    try {
      await cashRepository.closeRegister(ctx, register.id, Number(closingAmount), expectedCash)
      const ok = printCashCutTicket(buildPrintData('Z', Number(closingAmount), difference))
      if (!ok) toast('Permite ventanas emergentes para imprimir el corte', 'error')
      clearShiftSession()
      setRegister(null)
      setClosingAmount('')
      setSummary(EMPTY_SUMMARY)
      setLastCutType('Z')
      toast('Corte Z realizado — turno cerrado', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al cerrar turno', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMovement = () => {
    if (!moveModal || !moveAmount || !register) return
    addCashMovement(
      moveModal,
      Number(moveAmount),
      moveNote || (moveModal === 'entrada' ? 'Entrada de efectivo' : 'Salida de efectivo'),
      register.id
    )
    toast(`${moveModal === 'entrada' ? 'Entrada' : 'Salida'} registrada`, 'success')
    setMoveModal(null)
    setMoveAmount('')
    setMoveNote('')
  }

  const handleCorteX = () => {
    if (!register) return
    addPartialCut({
      opening: register.opening_amount,
      sales: summary.totalSales,
      expected: expectedCash,
      movements_net: movementsNet,
    })
    const ok = printCashCutTicket(buildPrintData('X'))
    if (!ok) toast('Permite ventanas emergentes para imprimir el corte', 'error')
    setCutModal(true)
    setLastCutType('X')
    toast('Corte X registrado', 'success')
  }

  const nowLabel = new Date().toLocaleString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-2xl space-y-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <PageBack to="/app/cash" label="Caja" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-50 text-brand-600"><CreditCard size={20} /></div>
              <div>
                <h3 className="font-bold text-slate-800">Turno de caja</h3>
                <p className="text-xs text-slate-500 font-mono">Apertura · Corte X · Corte Z</p>
              </div>
            </div>
            <Badge variant={register ? 'success' : 'default'}>
              {register ? 'Turno abierto' : 'Sin turno'}
            </Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {!register ? (
            <>
              <div className="rounded-xl bg-slate-50 border border-command-border p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <User size={14} /> Cajero: <span className="font-bold">{user?.full_name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={14} /> {nowLabel}
                </div>
              </div>
              <Input
                label="Fondo de apertura (efectivo inicial)"
                type="number"
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
                icon={<DollarSign size={15} />}
              />
              <p className="text-xs text-slate-500">
                El POS queda bloqueado para cobros hasta abrir turno.{' '}
                <Link to="/app/pos" className="text-brand-600 font-semibold hover:underline">Ir al POS</Link>
              </p>
              <Button onClick={handleOpen} loading={loading} className="w-full" size="lg">
                <Unlock size={16} /> Abrir turno de caja
              </Button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 flex items-center gap-1"><User size={12} /> Cajero</p>
                  <p className="font-bold text-slate-800">{user?.full_name}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} /> Apertura</p>
                  <p className="font-bold text-slate-800">{formatDate(register.opened_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Fondo inicial</p>
                  <p className="text-xl font-black">{formatCurrency(register.opening_amount)}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-xs text-emerald-600">Ventas del turno ({summary.orderCount})</p>
                  <p className="text-xl font-black text-emerald-700">{formatCurrency(summary.totalSales)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg border border-command-border p-2 text-center">
                  <p className="text-slate-500">Efectivo</p>
                  <p className="font-bold text-slate-800">{formatCurrency(summary.cashSales)}</p>
                </div>
                <div className="rounded-lg border border-command-border p-2 text-center">
                  <p className="text-slate-500">Tarjeta</p>
                  <p className="font-bold text-slate-800">{formatCurrency(summary.byMethod.tarjeta)}</p>
                </div>
                <div className="rounded-lg border border-command-border p-2 text-center">
                  <p className="text-slate-500">Digital</p>
                  <p className="font-bold text-slate-800">{formatCurrency(summary.byMethod.transferencia)}</p>
                </div>
              </div>

              {movementsNet !== 0 && (
                <p className="text-xs text-slate-500">Movimientos netos: {formatCurrency(movementsNet)}</p>
              )}

              <div className="bg-brand-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-500">Efectivo esperado en caja</p>
                <p className="text-3xl font-black text-brand-600">{formatCurrency(expectedCash)}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="flex-1 min-w-[100px]" onClick={() => setMoveModal('entrada')}>
                  <ArrowUp size={14} /> Entrada
                </Button>
                <Button variant="outline" size="sm" className="flex-1 min-w-[100px]" onClick={() => setMoveModal('salida')}>
                  <ArrowDown size={14} /> Salida
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 min-w-[100px]" onClick={handleCorteX}>
                  <FileText size={14} /> Corte X
                </Button>
                <Button variant="outline" size="sm" onClick={() => register && printCashCutTicket(buildPrintData('X'))}>
                  <Printer size={14} />
                </Button>
              </div>

              <Input
                label="Efectivo contado (Corte Z)"
                type="number"
                value={closingAmount}
                onChange={e => setClosingAmount(e.target.value)}
                icon={<DollarSign size={15} />}
              />
              {closingAmount && (
                <div className={`rounded-lg p-3 flex justify-between ${difference === 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <span className="text-sm font-medium">Diferencia</span>
                  <span className={`font-black ${difference === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(difference)}
                  </span>
                </div>
              )}
              <Button
                onClick={handleClose}
                loading={loading}
                variant="danger"
                className="w-full"
                size="lg"
                disabled={!closingAmount}
              >
                <Lock size={16} /> Cerrar turno (Corte Z)
              </Button>
            </>
          )}
        </CardBody>
      </Card>

      {register && shiftMovements.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-bold text-slate-800 mb-2">Movimientos del turno</p>
          {shiftMovements.slice(0, 8).map(m => (
            <div key={m.id} className="flex justify-between text-xs py-1 border-b border-command-border last:border-0">
              <span className={m.type === 'entrada' ? 'text-ops-success' : 'text-ops-danger'}>
                {m.type === 'entrada' ? '+' : '−'}{formatCurrency(m.amount)} — {m.note}
              </span>
              <span className="text-slate-400">{new Date(m.created_at).toLocaleTimeString('es-MX')}</span>
            </div>
          ))}
        </Card>
      )}

      {lastCutType === 'Z' && !register && (
        <Card className="p-4 border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800">Turno cerrado correctamente</p>
          <p className="text-xs text-emerald-700 mt-1">Puedes abrir un nuevo turno cuando inicies operaciones.</p>
        </Card>
      )}

      <Modal open={!!moveModal} onClose={() => setMoveModal(null)} title={moveModal === 'entrada' ? 'Entrada de efectivo' : 'Salida de efectivo'} size="sm">
        <div className="p-5 space-y-3">
          <Input label="Monto" type="number" value={moveAmount} onChange={e => setMoveAmount(e.target.value)} />
          <Input label="Concepto" value={moveNote} onChange={e => setMoveNote(e.target.value)} />
          <Button className="w-full" onClick={handleMovement}>Registrar</Button>
        </div>
      </Modal>

      <Modal open={cutModal} onClose={() => setCutModal(false)} title="Corte X — Parcial" size="sm">
        <div className="p-5 space-y-2 font-mono text-sm">
          <div className="flex justify-between"><span>Apertura</span><span>{formatCurrency(register?.opening_amount || 0)}</span></div>
          <div className="flex justify-between"><span>Ventas turno</span><span>{formatCurrency(summary.totalSales)}</span></div>
          <div className="flex justify-between"><span>Movimientos</span><span>{formatCurrency(movementsNet)}</span></div>
          <div className="flex justify-between font-bold text-brand-700 pt-2 border-t"><span>Efectivo esperado</span><span>{formatCurrency(expectedCash)}</span></div>
          <p className="text-[10px] text-slate-500 pt-2">Corte X #{partialCuts.length} — la caja sigue abierta</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => register && printCashCutTicket(buildPrintData('X'))}>
              <Printer size={14} /> Reimprimir
            </Button>
            <Button className="flex-1" onClick={() => setCutModal(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
