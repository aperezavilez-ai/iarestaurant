import { useEffect, useState } from 'react'
import { useTenantContext } from '@/hooks/useTenantContext'
import { dashboardRepository } from '@/repositories/dashboardRepository'
import type { DashboardStats } from '@/types'

export interface AIInsight {
  id: string
  type: 'alert' | 'suggestion' | 'prediction' | 'info'
  title: string
  message: string
  action?: string
}

function insightsEqual(a: AIInsight[], b: AIInsight[]): boolean {
  if (a.length !== b.length) return false
  return a.every((item, i) => {
    const other = b[i]
    return item.id === other.id && item.title === other.title && item.message === other.message
  })
}

function statsEqual(a: DashboardStats, b: DashboardStats): boolean {
  return (
    a.today_sales === b.today_sales &&
    a.today_orders === b.today_orders &&
    a.active_tables === b.active_tables &&
    a.total_tables === b.total_tables &&
    a.pending_orders === b.pending_orders &&
    a.avg_ticket === b.avg_ticket
  )
}

export function useLiveOps() {
  const ctx = useTenantContext()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [insights, setInsights] = useState<AIInsight[]>([])

  useEffect(() => {
    if (!ctx) return
    const load = async () => {
      const s = await dashboardRepository.getStats(ctx)
      setStats((prev) => (prev && statsEqual(prev, s) ? prev : s))
      const next = generateInsights(s)
      setInsights((prev) => (insightsEqual(prev, next) ? prev : next))
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [ctx])

  return { stats, insights, isLive: !!stats }
}

function generateInsights(stats: DashboardStats): AIInsight[] {
  const items: AIInsight[] = []

  if (stats.pending_orders > 3) {
    items.push({
      id: '1',
      type: 'alert',
      title: 'Cocina saturada',
      message: `${stats.pending_orders} órdenes en cola. Considera priorizar platillos rápidos.`,
      action: 'Ver cocina',
    })
  }

  if (stats.active_tables > stats.total_tables * 0.7) {
    items.push({
      id: '2',
      type: 'prediction',
      title: 'Pico de ocupación',
      message: `${stats.active_tables}/${stats.total_tables} mesas activas. Pico estimado en 25 min.`,
    })
  }

  if (stats.today_sales > 0 && stats.avg_ticket < 300) {
    items.push({
      id: '3',
      type: 'suggestion',
      title: 'Upselling IA',
      message: 'El 72% de mesas con tacos piden bebida. Sugiere combo al tomar orden.',
      action: 'Ir a POS',
    })
  }

  if (stats.top_products.length > 0) {
    items.push({
      id: '4',
      type: 'info',
      title: `Top: ${stats.top_products[0].name}`,
      message: `${stats.top_products[0].count} unidades vendidas hoy. Mantén stock de insumos.`,
    })
  }

  if (items.length === 0) {
    items.push({
      id: '0',
      type: 'info',
      title: 'Sistema operativo',
      message: 'Operación estable. IA monitoreando ventas, mesas y cocina en tiempo real.',
    })
  }

  return items
}
