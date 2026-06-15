import { memo, useEffect, useState } from 'react'
import { Clock, Users } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { Order, RestaurantTable, TableStatus } from '@/types'

const statusLabel: Record<TableStatus, string> = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  cobro_pendiente: 'Por cobrar',
}

const STATUS_STYLE: Record<TableStatus, { border: string; bg: string; dot: string; glow?: string }> = {
  libre: { border: 'border-ops-success/40', bg: 'bg-ops-success/5', dot: 'bg-ops-success' },
  ocupada: { border: 'border-ops-danger/40', bg: 'bg-ops-danger/5', dot: 'bg-ops-danger', glow: 'shadow-[0_0_16px_rgba(248,113,113,0.2)]' },
  reservada: { border: 'border-ops-info/40', bg: 'bg-ops-info/5', dot: 'bg-ops-info' },
  cobro_pendiente: { border: 'border-ops-warning/40', bg: 'bg-ops-warning/5', dot: 'bg-ops-warning' },
}

function useElapsedMinutes(openedAt?: string | null) {
  const [mins, setMins] = useState(0)

  useEffect(() => {
    if (!openedAt) {
      setMins(0)
      return
    }
    const calc = () => Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000)
    setMins(calc())
    const id = setInterval(() => setMins(calc()), 60_000)
    return () => clearInterval(id)
  }, [openedAt])

  return mins
}

export interface TableCardProps {
  table: RestaurantTable
  order?: Order
  waiterName?: string
  onSelect: (table: RestaurantTable) => void
  onCycleStatus: (table: RestaurantTable) => void
}

export const TableCard = memo(function TableCard({
  table,
  order,
  waiterName,
  onSelect,
  onCycleStatus,
}: TableCardProps) {
  const style = STATUS_STYLE[table.status]
  const mins = useElapsedMinutes(table.status === 'ocupada' ? table.opened_at : null)

  return (
    <button
      type="button"
      onClick={() => onSelect(table)}
      onDoubleClick={() => onCycleStatus(table)}
      className={cn(
        'rounded-2xl border-2 p-4 text-center transition-transform hover:scale-105 min-h-[100px]',
        style.border,
        style.bg,
        style.glow,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn('w-2.5 h-2.5 rounded-full', style.dot, table.status === 'ocupada' && 'animate-pulse-live')} />
        <span className="text-[9px] font-mono text-slate-600">{table.area?.name?.slice(0, 3)}</span>
      </div>
      <p className="text-3xl font-black text-slate-800">{table.number}</p>
      <div className="flex items-center justify-center gap-1 mt-1 text-slate-500">
        <Users size={10} />
        <span className="text-[10px] font-mono">{table.capacity}</span>
      </div>
      <p className="text-[10px] font-mono font-bold text-slate-400 mt-2 uppercase">{statusLabel[table.status]}</p>
      {waiterName && <p className="text-[9px] text-brand-600 truncate mt-0.5">{waiterName.split(' ')[0]}</p>}
      {order && <p className="text-[9px] font-mono text-slate-500 mt-0.5">{formatCurrency(order.total)}</p>}
      {table.status === 'ocupada' && mins > 0 && (
        <p className="text-[10px] text-ops-danger font-mono flex items-center justify-center gap-0.5 mt-1">
          <Clock size={9} />
          {mins}m
        </p>
      )}
    </button>
  )
})
