import { useEffect, useState } from 'react'
import { CreditCard, Lock, Unlock, DollarSign, FileText, ArrowDown, ArrowUp } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import { useTenantContext } from '@/hooks/useTenantContext'
import { cashRepository } from '@/repositories/cashRepository'
import { dashboardRepository } from '@/repositories/dashboardRepository'
import { useOpsDataStore } from '@/store/opsDataStore'
import type { CashRegister } from '@/types'
import { QRValidationPanel } from '@/components/qr/QRValidationPanel'

export default function CashPage() {
  const ctx = useTenantContext()
  const [register, setRegister] = useState<CashRegister | null>(null)
  const [openingAmount, setOpeningAmount] = useState('2000')
  const [closingAmount, setClosingAmount] = useState('')
  const [todaySales, setTodaySales] = useState(0)
  const [loading, setLoading] = useState(false)
  const [moveModal, setMoveModal] = useState<'entrada' | 'salida' | null>(null)
  const [moveAmount, setMoveAmount] = useState('')
  const [moveNote, setMoveNote] = useState('')
  const [cutModal, setCutModal] = useState(false)

  const cashMovements = useOpsDataStore(s => s.cashMovements)
  const partialCuts = useOpsDataStore(s => s.partialCuts)
  const addCashMovement = useOpsDataStore(s => s.addCashMovement)
  const addPartialCut = useOpsDataStore(s => s.addPartialCut)

  const movementsNet = cashMovements.reduce((s, m) => s + (m.type === 'entrada' ? m.amount : -m.amount), 0)

  const load = async () => {
    if (!ctx) return
    const [reg, stats] = await Promise.all([
      cashRepository.getOpenRegister(ctx),
      dashboardRepository.getStats(ctx),
    ])
    setRegister(reg)
    setTodaySales(stats.today_sales)
  }

  useEffect(() => { load() }, [ctx])

  const handleOpen = async () => {
    if (!ctx) return
    setLoading(true)
    try {
      const reg = await cashRepository.openRegister(ctx, Number(openingAmount))
      setRegister(reg)
      toast('Caja abierta correctamente', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al abrir caja', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    if (!ctx || !register) return
    const expected = register.opening_amount + todaySales + movementsNet
    setLoading(true)
    try {
      await cashRepository.closeRegister(ctx, register.id, Number(closingAmount), expected)
      setRegister(null)
      setClosingAmount('')
      toast('Corte Z realizado — caja cerrada', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al cerrar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMovement = () => {
    if (!moveModal || !moveAmount) return
    addCashMovement(moveModal, Number(moveAmount), moveNote || (moveModal === 'entrada' ? 'Entrada de efectivo' : 'Salida de efectivo'))
    toast(`${moveModal === 'entrada' ? 'Entrada' : 'Salida'} registrada`, 'success')
    setMoveModal(null)
    setMoveAmount('')
    setMoveNote('')
  }

  const handleCorteX = () => {
    if (!register) return
    const expected = register.opening_amount + todaySales + movementsNet
    addPartialCut({
      opening: register.opening_amount,
      sales: todaySales,
      expected,
      movements_net: movementsNet,
    })
    setCutModal(true)
    toast('Corte X registrado', 'success')
  }

  const expected = register ? register.opening_amount + todaySales + movementsNet : 0
  const difference = register && closingAmount ? Number(closingAmount) - expected : 0

  return (
    <div className="max-w-2xl space-y-6">
      <QRValidationPanel />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-50 text-brand-600"><CreditCard size={20} /></div>
              <div>
                <h3 className="font-bold text-slate-800">Estado de caja</h3>
                <p className="text-xs text-slate-500 font-mono">Apertura · Corte X · Corte Z</p>
              </div>
            </div>
            <Badge variant={register ? 'success' : 'default'}>
              {register ? 'Abierta' : 'Cerrada'}
            </Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {!register ? (
            <>
              <Input label="Fondo de apertura" type="number" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} icon={<DollarSign size={15} />} />
              <Button onClick={handleOpen} loading={loading} className="w-full" size="lg">
                <Unlock size={16} /> Abrir caja
              </Button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Apertura</p>
                  <p className="text-xl font-black">{formatCurrency(register.opening_amount)}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(register.opened_at)}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-xs text-emerald-600">Ventas del turno</p>
                  <p className="text-xl font-black text-emerald-700">{formatCurrency(todaySales)}</p>
                </div>
              </div>
              {movementsNet !== 0 && (
                <p className="text-xs text-slate-500">Movimientos netos: {formatCurrency(movementsNet)}</p>
              )}
              <div className="bg-brand-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-500">Efectivo esperado en caja</p>
                <p className="text-3xl font-black text-brand-600">{formatCurrency(expected)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setMoveModal('entrada')}><ArrowUp size={14} /> Entrada</Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setMoveModal('salida')}><ArrowDown size={14} /> Salida</Button>
                <Button variant="secondary" size="sm" className="flex-1" onClick={handleCorteX}><FileText size={14} /> Corte X</Button>
              </div>
              <Input label="Efectivo contado (Corte Z)" type="number" value={closingAmount} onChange={e => setClosingAmount(e.target.value)} icon={<DollarSign size={15} />} />
              {closingAmount && (
                <div className={`rounded-lg p-3 flex justify-between ${difference === 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <span className="text-sm font-medium">Diferencia</span>
                  <span className={`font-black ${difference === 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(difference)}</span>
                </div>
              )}
              <Button onClick={handleClose} loading={loading} variant="danger" className="w-full" size="lg" disabled={!closingAmount}>
                <Lock size={16} /> Cerrar caja (Corte Z)
              </Button>
            </>
          )}
        </CardBody>
      </Card>

      {register && cashMovements.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-bold text-slate-800 mb-2">Movimientos del turno</p>
          {cashMovements.slice(0, 5).map(m => (
            <div key={m.id} className="flex justify-between text-xs py-1 border-b border-command-border last:border-0">
              <span className={m.type === 'entrada' ? 'text-ops-success' : 'text-ops-danger'}>
                {m.type === 'entrada' ? '+' : '−'}{formatCurrency(m.amount)} — {m.note}
              </span>
              <span className="text-slate-400">{new Date(m.created_at).toLocaleTimeString('es-MX')}</span>
            </div>
          ))}
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
          <div className="flex justify-between"><span>Ventas turno</span><span>{formatCurrency(todaySales)}</span></div>
          <div className="flex justify-between"><span>Movimientos</span><span>{formatCurrency(movementsNet)}</span></div>
          <div className="flex justify-between font-bold text-brand-700 pt-2 border-t"><span>Esperado</span><span>{formatCurrency(expected)}</span></div>
          <p className="text-[10px] text-slate-500 pt-2">Corte X #{partialCuts.length} — la caja sigue abierta</p>
          <Button className="w-full mt-2" onClick={() => setCutModal(false)}>Cerrar</Button>
        </div>
      </Modal>
    </div>
  )
}
