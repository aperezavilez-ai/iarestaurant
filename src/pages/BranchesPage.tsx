import { useEffect, useState } from 'react'
import { Building2, MapPin, Phone } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { useTenantContext } from '@/hooks/useTenantContext'
import { localDb } from '@/lib/localDb'
import type { Sucursal } from '@/types'

export default function BranchesPage() {
  const ctx = useTenantContext()
  const [branches, setBranches] = useState<Sucursal[]>([])

  useEffect(() => {
    if (!ctx) return
    localDb.getSucursales(ctx.tenantId).then(setBranches)
  }, [ctx])

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-800">Sucursales</h3>
        <Button size="sm"><Plus size={14} /> Nueva sucursal</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map(b => (
          <Card key={b.id}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-50 text-brand-600"><Building2 size={18} /></div>
                  <div>
                    <p className="font-bold text-slate-800">{b.name}</p>
                    {b.id === ctx?.sucursalId && <Badge variant="amber" className="mt-1">Activa</Badge>}
                  </div>
                </div>
                <Badge variant={b.is_active ? 'success' : 'default'}>{b.is_active ? 'Operando' : 'Inactiva'}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2"><MapPin size={14} />{b.address}</p>
                {b.phone && <p className="flex items-center gap-2"><Phone size={14} />{b.phone}</p>}
                <p className="text-xs text-slate-400">{b.timezone} · {b.currency} · IVA {b.tax_rate}%</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
