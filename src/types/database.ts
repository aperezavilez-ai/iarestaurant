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

export type TableStatus = 'libre' | 'ocupada' | 'reservada' | 'cobro'
export type OrderStatus = 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado'
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto' | 'digital'
export type TicketStatus = 'abierto' | 'cerrado' | 'cancelado'

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url?: string
  primary_color: string
  plan: 'basic' | 'pro' | 'enterprise'
  is_active: boolean
  created_at: string
}

export interface Branch {
  id: string
  tenant_id: string
  name: string
  address: string
  phone?: string
  timezone: string
  currency: string
  is_active: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  tenant_id: string
  branch_id?: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  created_at: string
}

export interface ServiceArea {
  id: string
  branch_id: string
  tenant_id: string
  name: string
  description?: string
  capacity: number
  is_active: boolean
}

export interface RestaurantTable {
  id: string
  branch_id: string
  tenant_id: string
  area_id: string
  number: number
  capacity: number
  status: TableStatus
  current_ticket_id?: string
  waiter_id?: string
  opened_at?: string
  is_active: boolean
}

export interface Category {
  id: string
  tenant_id: string
  branch_id?: string
  name: string
  description?: string
  image_url?: string
  sort_order: number
  is_active: boolean
}

export interface Product {
  id: string
  tenant_id: string
  branch_id?: string
  category_id: string
  name: string
  description?: string
  image_url?: string
  price: number
  cost?: number
  sku?: string
  tax_rate: number
  has_variants: boolean
  is_active: boolean
  sort_order: number
  allergens?: string[]
}

export interface Ticket {
  id: string
  folio: string
  tenant_id: string
  branch_id: string
  table_id?: string
  waiter_id?: string
  cashier_id?: string
  status: TicketStatus
  subtotal: number
  tax: number
  discount: number
  total: number
  tip: number
  notes?: string
  opened_at: string
  closed_at?: string
}

export interface TicketItem {
  id: string
  ticket_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  status: OrderStatus
  notes?: string
  modifiers?: string[]
  created_at: string
}

export interface CashRegister {
  id: string
  branch_id: string
  tenant_id: string
  cashier_id: string
  opening_amount: number
  closing_amount?: number
  expected_amount?: number
  difference?: number
  opened_at: string
  closed_at?: string
  is_open: boolean
}

export interface Payment {
  id: string
  ticket_id: string
  tenant_id: string
  method: PaymentMethod
  amount: number
  reference?: string
  created_at: string
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

// Supabase Database interface (expandable)
export interface Database {
  public: {
    Tables: {
      tenants: { Row: Tenant; Insert: Omit<Tenant, 'id' | 'created_at'>; Update: Partial<Tenant> }
      branches: { Row: Branch; Insert: Omit<Branch, 'id' | 'created_at'>; Update: Partial<Branch> }
      user_profiles: { Row: UserProfile; Insert: Omit<UserProfile, 'id' | 'created_at'>; Update: Partial<UserProfile> }
      service_areas: { Row: ServiceArea; Insert: Omit<ServiceArea, 'id'>; Update: Partial<ServiceArea> }
      tables: { Row: RestaurantTable; Insert: Omit<RestaurantTable, 'id'>; Update: Partial<RestaurantTable> }
      categories: { Row: Category; Insert: Omit<Category, 'id'>; Update: Partial<Category> }
      products: { Row: Product; Insert: Omit<Product, 'id'>; Update: Partial<Product> }
      tickets: { Row: Ticket; Insert: Omit<Ticket, 'id'>; Update: Partial<Ticket> }
      ticket_items: { Row: TicketItem; Insert: Omit<TicketItem, 'id' | 'created_at'>; Update: Partial<TicketItem> }
      cash_registers: { Row: CashRegister; Insert: Omit<CashRegister, 'id'>; Update: Partial<CashRegister> }
      payments: { Row: Payment; Insert: Omit<Payment, 'id' | 'created_at'>; Update: Partial<Payment> }
      audit_logs: { Row: AuditLog; Insert: Omit<AuditLog, 'id' | 'created_at'>; Update: never }
    }
  }
}
