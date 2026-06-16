// Tipos para módulos demo extendidos

export type ProductionCenter = 'cocina_caliente' | 'cocina_fria' | 'barra' | 'cafeteria' | 'postres'

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  price_modifier: number
  is_active: boolean
}

export interface Ingredient {
  id: string
  tenant_id: string
  name: string
  unit: string
  stock: number
  min_stock: number
  cost: number
  supplier_id?: string
}

export interface Supplier {
  id: string
  tenant_id: string
  name: string
  contact: string
  phone: string
  email: string
  is_active: boolean
}

export interface PurchaseOrder {
  id: string
  tenant_id: string
  supplier_id: string
  supplier_name: string
  total: number
  status: 'pendiente' | 'recibida' | 'parcial' | 'cancelada'
  created_at: string
}

export interface Customer {
  id: string
  tenant_id: string
  sucursal_id?: string
  name: string
  email?: string
  phone?: string
  visits: number
  points: number
  total_spent: number
  segment: 'nuevo' | 'frecuente' | 'vip'
  created_at: string
}

export interface Promotion {
  id: string
  tenant_id: string
  name: string
  type: '2x1' | 'combo' | 'porcentaje' | 'monto' | 'happy_hour'
  value: number
  active: boolean
  schedule?: string
}

export interface Invoice {
  id: string
  tenant_id: string
  folio: string
  order_id?: string
  order_folio: string
  rfc: string
  razon_social?: string
  email?: string
  uso_cfdi: string
  subtotal: number
  tax: number
  total: number
  status: 'timbrada' | 'cancelada' | 'pendiente'
  uuid?: string
  cancel_reason?: string
  canceled_at?: string
  created_at: string
  stamped_at?: string
}

export interface Reservation {
  id: string
  tenant_id: string
  customer_name: string
  phone?: string
  guests: number
  date: string
  time: string
  table_number?: number
  table_id?: string
  status: 'confirmada' | 'pendiente' | 'cancelada' | 'completada' | 'en_espera'
  notes?: string
  created_at: string
}

export interface WaitlistEntry {
  id: string
  tenant_id: string
  customer_name: string
  guests: number
  phone?: string
  created_at: string
  estimated_wait: number
}

export interface StockMovement {
  id: string
  tenant_id: string
  ingredient_id: string
  ingredient_name: string
  delta: number
  reason: string
  created_at: string
}

export interface CashMovement {
  id: string
  tenant_id: string
  register_id?: string
  type: 'entrada' | 'salida'
  amount: number
  note: string
  created_at: string
}

export interface PartialCashCut {
  id: string
  opening: number
  sales: number
  expected: number
  movements_net: number
  created_at: string
}

export interface DeliveryOrder {
  id: string
  tenant_id: string
  customer_name: string
  phone?: string
  address: string
  total: number
  status: 'recibido' | 'preparando' | 'en_camino' | 'entregado' | 'cancelado'
  driver?: string
  order_id?: string
  notes?: string
  created_at: string
}

export interface LoyaltyRule {
  id: string
  name: string
  points_per_amount: number
  amount_threshold: number
  active: boolean
}

export interface SubscriptionPlan {
  id: string
  name: 'basico' | 'profesional' | 'enterprise'
  price: number
  max_users: number
  max_branches: number
  max_tables: number
  max_products: number
  features: string[]
}

export interface Permission {
  id: string
  module: string
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
  authorize: boolean
}

export interface Notification {
  id: string
  tenant_id: string
  channel: 'push' | 'whatsapp' | 'email' | 'interno'
  title: string
  message: string
  status: 'enviada' | 'pendiente' | 'error'
  created_at: string
}

export interface QRSession {
  id: string
  table_number: number
  area: string
  waiter: string
  status: 'activa' | 'expirada' | 'cerrada'
  expires_at: string
}

export interface Integration {
  id: string
  name: string
  category: string
  status: 'conectado' | 'disponible' | 'próximamente'
  icon: string
}

export interface SupportTicket {
  id: string
  tenant_id: string
  subject: string
  priority: 'baja' | 'media' | 'alta'
  status: 'abierto' | 'en_progreso' | 'resuelto'
  created_at: string
}

export interface Employee {
  id: string
  tenant_id: string
  full_name: string
  role: string
  shift: string
  attendance: 'presente' | 'retardo' | 'falta'
  hours_week: number
}

export interface WorkflowRule {
  id: string
  name: string
  trigger: string
  condition: string
  action: string
  active: boolean
}

export interface MarketplaceModule {
  id: string
  name: string
  author: string
  price: number
  category: string
  installed: boolean
}

export interface SaaSMetric {
  label: string
  value: string
  trend?: string
}
