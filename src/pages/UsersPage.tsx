import { SEED_STAFF } from '@/data/seed'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Plus, Users } from 'lucide-react'
import { getRoleLabel } from '@/lib/utils'

export default function UsersPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-50 text-brand-600"><Users size={18} /></div>
              <h3 className="font-bold text-slate-800">Personal del restaurante</h3>
            </div>
            <Button size="sm"><Plus size={14} /> Nuevo usuario</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-command-border">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Estado'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-mono text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {SEED_STAFF.map(u => (
                <tr key={u.id} className="hover:bg-command-elevated/50">
                  <td className="px-5 py-3 font-semibold text-slate-800">{u.full_name}</td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-sm">{u.email}</td>
                  <td className="px-5 py-3"><Badge>{getRoleLabel(u.role)}</Badge></td>
                  <td className="px-5 py-3"><Badge variant="success">Activo</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-slate-400 text-center">Gestión completa de usuarios — Fase 26 (RRHH)</p>
    </div>
  )
}
