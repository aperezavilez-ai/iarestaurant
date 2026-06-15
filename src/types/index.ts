// ═══════════════════════════════════════════════
// TIPOS GLOBALES — IA-Restaurant SaaS
// ═══════════════════════════════════════════════

export type UserRole =
  | 'admin_saas'
  | 'admin_restaurant'
  | 'gerente'
  | 'supervisor'
  | 'capitan'
  | 'mesero'
  | 'cajero'
  | 'cocina'
  | 'cliente'

export const ASSIGNABLE_STAFF_ROLES: UserRole[] = [
  'cajero', 'mesero', 'cocina', 'supervisor', 'capitan', 'gerente',
]

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url?: string
  primary_color: string
  plan: 'basico' | 'profesional' | 'enterprise'
  max_sucursales: number
  max_usuarios: number
  max_mesas: number
  max_productos: number
  is_active: boolean
  created_at: string
}

export type PaymentGatewayId = 'mercadopago' | 'clip' | 'stripe'

export interface PaymentConfig {
  gateway?: PaymentGatewayId
  public_key?: string
  access_token?: string
  secret_key?: string
}

export interface Organization {
  id: string
  tenant_id: string
  name: string
  rfc?: string
  address?: string
  phone?: string
  email?: string
  whatsapp_alerts?: string
  reports_email?: string
  payment_config?: PaymentConfig
  created_at: string
}

export interface Sucursal {
  id: string
  tenant_id: string
  organization_id: string
  name: string
  address: string
  phone?: string
  timezone: string
  currency: string
  tax_rate: number
  is_active: boolean
  created_at: string
}

export interface User {
  id: string
  tenant_id: string
  email: string
  full_name: string
  role: UserRole
  sucursal_id?: string
  avatar_url?: string
  is_active: boolean
  allowed_modules?: string[]
  last_login?: string
  created_at: string
}

export interface Category {
  id: string
  tenant_id: string
  sucursal_id?: string
  name: string
  description?: string
  color: string
  icon?: string
  sort_order: number
  is_active: boolean
  kitchen_center?: string
}

export interface Product {
  id: string
  tenant_id: string
  sucursal_id?: string
  category_id: string
  name: string
  description?: string
  price: number
  cost: number
  image_url?: string
  sku?: string
  is_active: boolean
  has_variants: boolean
  allergens?: string[]
  preparation_time?: number
  category?: Category
}

export interface TableArea {
  id: string
  tenant_id: string
  sucursal_id: string
  name: string
  color: string
  sort_order: number
  is_active: boolean
}

export type TableStatus = 'libre' | 'ocupada' | 'reservada' | 'cobro_pendiente'

export interface RestaurantTable {
  id: string
  tenant_id: string
  sucursal_id: string
  area_id: string
  number: number
  capacity: number
  status: TableStatus
  current_order_id?: string
  assigned_waiter_id?: string
  customer_id?: string
  customer_name?: string
  opened_at?: string
  area?: TableArea
  assigned_waiter?: User
}

export type OrderStatus =
  | 'abierta'
  | 'en_preparacion'
  | 'lista'
  | 'entregada'
  | 'cobrada'
  | 'cancelada'

export type OrderItemStatus =
  | 'pendiente'
  | 'preparando'
  | 'listo'
  | 'entregado'
  | 'cancelado'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  notes?: string
  status: OrderItemStatus
  product?: Product
}

export interface Order {
  id: string
  tenant_id: string
  sucursal_id: string
  table_id?: string
  folio: string
  status: OrderStatus
  waiter_id?: string
  cashier_id?: string
  customer_id?: string
  customer_name?: string
  subtotal: number
  tax: number
  discount: number
  total: number
  guests: number
  notes?: string
  items?: OrderItem[]
  created_at: string
  updated_at: string
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'

export interface Payment {
  id: string
  order_id: string
  tenant_id: string
  method: PaymentMethod
  amount: number
  change_amount?: number
  reference?: string
  created_at: string
}

export interface CashRegister {
  id: string
  tenant_id: string
  sucursal_id: string
  cashier_id: string
  opening_amount: number
  closing_amount?: number
  expected_amount?: number
  difference?: number
  status: 'abierta' | 'cerrada'
  opened_at: string
  closed_at?: string
  cashier?: User
}

export interface AuditLog {
  id: string
  tenant_id: string
  user_id: string
  action: string
  table_name: string
  record_id: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface DashboardStats {
  today_sales: number
  today_orders: number
  active_tables: number
  total_tables: number
  avg_ticket: number
  pending_orders: number
  top_products: { name: string; count: number; revenue: number }[]
  hourly_sales: { hour: string; amount: number }[]
}
