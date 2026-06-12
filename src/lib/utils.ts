import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function generateFolio(prefix = 'ORD'): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `${prefix}-${date}-${rand}`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    libre: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ocupada: 'bg-red-100 text-red-700 border-red-200',
    reservada: 'bg-blue-100 text-blue-700 border-blue-200',
    cobro_pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
    pendiente: 'bg-slate-100 text-slate-700',
    preparando: 'bg-orange-100 text-orange-700',
    listo: 'bg-emerald-100 text-emerald-700',
    entregado: 'bg-blue-100 text-blue-700',
    cancelado: 'bg-red-100 text-red-700',
    abierta: 'bg-emerald-100 text-emerald-700',
    cerrada: 'bg-slate-100 text-slate-700',
  }
  return colors[status] || 'bg-slate-100 text-slate-600'
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin_saas: 'Admin SaaS',
    admin_restaurant: 'Admin Restaurante',
    gerente: 'Gerente',
    supervisor: 'Supervisor',
    capitan: 'Capitán de Piso',
    mesero: 'Mesero',
    cajero: 'Cajero',
    cocina: 'Cocina / Barra',
    cliente: 'Cliente',
  }
  return labels[role] || role
}
