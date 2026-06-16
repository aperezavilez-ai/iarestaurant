import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, ChevronRight, Vault } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTenantContext } from '@/hooks/useTenantContext'
import { PaymentGatewaysPromo } from '@/components/payments/PaymentGatewaysPromo'
import { cashRepository } from '@/repositories/cashRepository'
import type { CashRegister } from '@/types'
import { QRValidationPanel } from '@/components/qr/QRValidationPanel'
import { TableQrPrintPanel } from '@/components/qr/TableQrPrintPanel'

export default function CashPage() {
  const ctx = useTenantContext()
  const [register, setRegister] = useState<CashRegister | null>(null)

  useEffect(() => {
    if (!ctx) return
    cashRepository.getOpenRegister(ctx).then(setRegister)
  }, [ctx])

  return (
    <div className="max-w-2xl space-y-6">
      <PaymentGatewaysPromo />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-50 text-brand-600"><Vault size={20} /></div>
              <div>
                <h3 className="font-bold text-slate-800">Turno de caja</h3>
                <p className="text-xs text-slate-500">Apertura, cortes X/Z e impresión</p>
              </div>
            </div>
            <Badge variant={register ? 'success' : 'danger'}>
              {register ? 'Abierta' : 'Cerrada'}
            </Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {register ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-1">
              <p className="text-sm font-semibold text-emerald-800">Turno activo</p>
              <p className="text-xs text-emerald-700">
                Apertura {formatDate(register.opened_at)} · Fondo {formatCurrency(register.opening_amount)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              No hay turno abierto. El POS no permite cobrar hasta abrir caja.
            </p>
          )}
          <Link to="/app/cash/shift">
            <Button className="w-full" size="lg">
              <CreditCard size={16} />
              {register ? 'Gestionar turno y cortes' : 'Abrir turno de caja'}
              <ChevronRight size={16} className="ml-auto" />
            </Button>
          </Link>
        </CardBody>
      </Card>

      <TableQrPrintPanel />
      <QRValidationPanel />
    </div>
  )
}
