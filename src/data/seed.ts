import type {
  Category,
  Product,
  RestaurantTable,
  TableArea,
  Order,
  OrderItem,
  Sucursal,
  Organization,
  Tenant,
  User,
  CashRegister,
} from '@/types'
import { DEMO_ORG_ID, DEMO_SUCURSAL_ID, DEMO_TENANT_ID } from '@/lib/config'
import { getProductImageUrl } from '@/lib/productImages'
import { SOUVENIR_ITEMS } from '@/data/souvenirsCatalog'

const T = DEMO_TENANT_ID
const S = DEMO_SUCURSAL_ID

export const SEED_TENANT: Tenant = {
  id: T,
  name: 'IA-RESTAURANT',
  slug: 'ia-restaurant',
  primary_color: '#f59000',
  plan: 'profesional',
  max_sucursales: 5,
  max_usuarios: 20,
  max_mesas: 50,
  max_productos: 200,
  is_active: true,
  created_at: new Date().toISOString(),
}

export const SEED_ORGANIZATION: Organization = {
  id: DEMO_ORG_ID,
  tenant_id: T,
  name: 'IA-RESTAURANT S.A.',
  rfc: 'IAR240101ABC',
  address: 'Av. Reforma 123, CDMX',
  phone: '+52 55 1234 5678',
  email: 'info@iarestaurant.com',
  created_at: new Date().toISOString(),
}

export const SEED_SUCURSAL: Sucursal = {
  id: S,
  tenant_id: T,
  organization_id: DEMO_ORG_ID,
  name: 'Sucursal Centro',
  address: 'Av. Reforma 123, CDMX',
  phone: '+52 55 1234 5678',
  timezone: 'America/Mexico_City',
  currency: 'MXN',
  tax_rate: 16,
  is_active: true,
  created_at: new Date().toISOString(),
}

export const SEED_USERS: Omit<User, 'id'>[] = [
  { tenant_id: T, email: 'admin@iarestaurant.mx', full_name: 'Alfonso Admin', role: 'admin_restaurant', sucursal_id: S, is_active: true, created_at: new Date().toISOString() },
  { tenant_id: T, email: 'alfonsoavilery@icloud.com', full_name: 'Alfonso', role: 'admin_restaurant', sucursal_id: S, is_active: false, created_at: new Date().toISOString() },
  { tenant_id: T, email: 'cajero@iarestaurant.com', full_name: 'Cajero Demo', role: 'cajero', sucursal_id: S, is_active: true, created_at: new Date().toISOString() },
  { tenant_id: T, email: 'mesero@iarestaurant.com', full_name: 'Mesero Demo', role: 'mesero', sucursal_id: S, is_active: true, created_at: new Date().toISOString() },
  { tenant_id: T, email: 'cocina@iarestaurant.com', full_name: 'Cocina Demo', role: 'cocina', sucursal_id: S, is_active: true, created_at: new Date().toISOString() },
]

export const DEMO_CREDENTIALS = [
  { email: 'admin@iarestaurant.mx', password: 'AdminIAR2026!', userIndex: 0 },
  { email: 'cajero@iarestaurant.com', password: 'demo123', userIndex: 2 },
  { email: 'mesero@iarestaurant.com', password: 'demo123', userIndex: 3 },
  { email: 'cocina@iarestaurant.com', password: 'demo123', userIndex: 4 },
]

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat-tacos', tenant_id: T, sucursal_id: S, name: 'Tacos', color: '#f59000', sort_order: 1, is_active: true, kitchen_center: 'barra_caliente' },
  { id: 'cat-platillos', tenant_id: T, sucursal_id: S, name: 'Platillos', color: '#16213e', sort_order: 2, is_active: true, kitchen_center: 'barra_caliente' },
  { id: 'cat-entradas', tenant_id: T, sucursal_id: S, name: 'Entradas', color: '#10b981', sort_order: 3, is_active: true, kitchen_center: 'barra_caliente' },
  { id: 'cat-bebidas', tenant_id: T, sucursal_id: S, name: 'Bebidas', color: '#3b82f6', sort_order: 4, is_active: true, kitchen_center: 'bebidas' },
  { id: 'cat-cocteles', tenant_id: T, sucursal_id: S, name: 'Cocteles', color: '#8b5cf6', sort_order: 5, is_active: true, kitchen_center: 'barra_fria' },
  { id: 'cat-postres', tenant_id: T, sucursal_id: S, name: 'Postres', color: '#ec4899', sort_order: 6, is_active: true, kitchen_center: 'postres' },
  { id: 'cat-souvenirs', tenant_id: T, sucursal_id: S, name: 'Souvenirs', color: '#a855f7', sort_order: 7, is_active: true, kitchen_center: 'souvenirs' },
]

export const SEED_PRODUCTS: Product[] = [
  { id: 'p1', tenant_id: T, sucursal_id: S, category_id: 'cat-tacos', name: 'Tacos de Pastor', price: 65, cost: 22, is_active: true, has_variants: true, preparation_time: 8 },
  { id: 'p2', tenant_id: T, sucursal_id: S, category_id: 'cat-tacos', name: 'Tacos de Bistec', price: 70, cost: 28, is_active: true, has_variants: false, preparation_time: 8 },
  { id: 'p3', tenant_id: T, sucursal_id: S, category_id: 'cat-platillos', name: 'Enchiladas Verdes', price: 80, cost: 30, is_active: true, has_variants: false, preparation_time: 15 },
  { id: 'p4', tenant_id: T, sucursal_id: S, category_id: 'cat-platillos', name: 'Pozole Rojo', price: 95, cost: 38, is_active: true, has_variants: false, preparation_time: 20 },
  { id: 'p5', tenant_id: T, sucursal_id: S, category_id: 'cat-entradas', name: 'Guacamole', price: 55, cost: 18, is_active: true, has_variants: false, preparation_time: 5 },
  { id: 'p6', tenant_id: T, sucursal_id: S, category_id: 'cat-entradas', name: 'Queso Fundido', price: 75, cost: 25, is_active: true, has_variants: false, preparation_time: 10 },
  { id: 'p7', tenant_id: T, sucursal_id: S, category_id: 'cat-bebidas', name: 'Agua de Jamaica', price: 25, cost: 6, is_active: true, has_variants: false, preparation_time: 2 },
  { id: 'p8', tenant_id: T, sucursal_id: S, category_id: 'cat-bebidas', name: 'Horchata', price: 25, cost: 6, is_active: true, has_variants: false, preparation_time: 2 },
  { id: 'p9', tenant_id: T, sucursal_id: S, category_id: 'cat-bebidas', name: 'Refresco', price: 30, cost: 8, is_active: true, has_variants: false, preparation_time: 1 },
  { id: 'p10', tenant_id: T, sucursal_id: S, category_id: 'cat-bebidas', name: 'Cerveza', price: 45, cost: 15, is_active: true, has_variants: false, preparation_time: 1 },
  { id: 'p11', tenant_id: T, sucursal_id: S, category_id: 'cat-cocteles', name: 'Margarita Clásica', price: 85, cost: 30, is_active: true, has_variants: true, preparation_time: 5 },
  { id: 'p12', tenant_id: T, sucursal_id: S, category_id: 'cat-cocteles', name: 'Michelada', price: 65, cost: 22, is_active: true, has_variants: false, preparation_time: 4 },
  { id: 'p13', tenant_id: T, sucursal_id: S, category_id: 'cat-postres', name: 'Flan Napolitano', price: 45, cost: 12, is_active: true, has_variants: false, preparation_time: 3 },
  { id: 'p14', tenant_id: T, sucursal_id: S, category_id: 'cat-postres', name: 'Churros', price: 50, cost: 14, is_active: false, has_variants: false, preparation_time: 6 },
  ...SOUVENIR_ITEMS.map((item, i) => ({
    id: `p-sv-${i + 1}`,
    tenant_id: T,
    sucursal_id: S,
    category_id: 'cat-souvenirs',
    name: item.name,
    description: 'Artículo promocional con el logo de tu restaurante',
    price: item.price,
    cost: item.cost,
    sku: item.sku,
    is_active: true,
    has_variants: false,
    preparation_time: 1,
  })),
].map((p) => ({ ...p, image_url: getProductImageUrl(p) }))

export const SEED_AREAS: TableArea[] = [
  { id: 'area1', tenant_id: T, sucursal_id: S, name: 'Salón Principal', color: '#f59000', sort_order: 1, is_active: true },
  { id: 'area2', tenant_id: T, sucursal_id: S, name: 'Terraza', color: '#16213e', sort_order: 2, is_active: true },
]

const tableStatuses: RestaurantTable['status'][] = [
  'libre', 'ocupada', 'ocupada', 'reservada', 'libre', 'cobro_pendiente', 'ocupada', 'libre',
]

export const SEED_TABLES: RestaurantTable[] = [
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `t${i + 1}`,
    tenant_id: T,
    sucursal_id: S,
    area_id: 'area1',
    number: i + 1,
    capacity: i % 3 === 0 ? 6 : 4,
    status: tableStatuses[i],
    area: SEED_AREAS[0],
    current_order_id: i === 4 ? 'ord-1' : i === 5 ? 'ord-3' : undefined,
    assigned_waiter_id: tableStatuses[i] === 'ocupada' || tableStatuses[i] === 'cobro_pendiente' ? 'user-mesero' : undefined,
    opened_at: tableStatuses[i] === 'ocupada' || tableStatuses[i] === 'cobro_pendiente'
      ? new Date(Date.now() - (i === 5 ? 45 : 32) * 60000).toISOString()
      : undefined,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `t${i + 9}`,
    tenant_id: T,
    sucursal_id: S,
    area_id: 'area2',
    number: i + 9,
    capacity: 2,
    status: (['libre', 'ocupada', 'libre', 'ocupada', 'libre', 'ocupada'][i]) as RestaurantTable['status'],
    area: SEED_AREAS[1],
    current_order_id: i === 3 ? 'ord-2' : undefined,
    assigned_waiter_id: i % 2 === 1 ? 'user-mesero' : undefined,
    opened_at: i % 2 === 1 ? new Date(Date.now() - 18 * 60000).toISOString() : undefined,
  })),
]

const now = Date.now()

export const SEED_ORDERS: Order[] = [
  {
    id: 'ord-1', tenant_id: T, sucursal_id: S, table_id: 't5', folio: 'ORD-20260611-0001',
    status: 'en_preparacion', waiter_id: 'user-mesero', subtotal: 418.1, tax: 66.9, discount: 0, total: 485,
    guests: 4, created_at: new Date(now - 12 * 60000).toISOString(), updated_at: new Date(now - 3 * 60000).toISOString(),
  },
  {
    id: 'ord-2', tenant_id: T, sucursal_id: S, table_id: 't12', folio: 'ORD-20260611-0002',
    status: 'abierta', waiter_id: 'user-mesero', subtotal: 198.28, tax: 31.72, discount: 0, total: 230,
    guests: 2, created_at: new Date(now - 3 * 60000).toISOString(), updated_at: new Date(now - 3 * 60000).toISOString(),
  },
  {
    id: 'ord-3', tenant_id: T, sucursal_id: S, table_id: 't6', folio: 'ORD-20260611-0003',
    status: 'lista', waiter_id: 'user-mesero', subtotal: 129.31, tax: 20.69, discount: 0, total: 150,
    guests: 4, created_at: new Date(now - 18 * 60000).toISOString(), updated_at: new Date(now - 1 * 60000).toISOString(),
  },
]

export const SEED_ORDER_ITEMS: OrderItem[] = [
  { id: 'oi-1', order_id: 'ord-1', product_id: 'p1', product_name: 'Tacos de Pastor', quantity: 3, unit_price: 65, subtotal: 195, status: 'preparando' },
  { id: 'oi-2', order_id: 'ord-1', product_id: 'p5', product_name: 'Guacamole', quantity: 1, unit_price: 55, subtotal: 55, status: 'pendiente' },
  { id: 'oi-3', order_id: 'ord-1', product_id: 'p7', product_name: 'Agua de Jamaica', quantity: 2, unit_price: 25, subtotal: 50, status: 'listo' },
  { id: 'oi-4', order_id: 'ord-2', product_id: 'p4', product_name: 'Pozole Rojo', quantity: 1, unit_price: 95, subtotal: 95, status: 'pendiente' },
  { id: 'oi-5', order_id: 'ord-2', product_id: 'p3', product_name: 'Enchiladas Verdes', quantity: 2, unit_price: 80, subtotal: 160, status: 'pendiente', notes: 'Sin crema' },
  { id: 'oi-6', order_id: 'ord-3', product_id: 'p11', product_name: 'Margarita Clásica', quantity: 2, unit_price: 85, subtotal: 170, status: 'preparando' },
  { id: 'oi-7', order_id: 'ord-3', product_id: 'p10', product_name: 'Cerveza', quantity: 1, unit_price: 45, subtotal: 45, status: 'listo' },
]

export const SEED_SUCURSALES: Sucursal[] = [
  SEED_SUCURSAL,
  {
    id: '00000000-0000-0000-0000-000000000004',
    tenant_id: T,
    organization_id: DEMO_ORG_ID,
    name: 'Sucursal Polanco',
    address: 'Av. Presidente Masaryk 200, CDMX',
    phone: '+52 55 8765 4321',
    timezone: 'America/Mexico_City',
    currency: 'MXN',
    tax_rate: 16,
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

export const SEED_STAFF: User[] = SEED_USERS.map((u, i) => ({
  ...u,
  id: `user-${['admin', 'cajero', 'mesero', 'cocina'][i]}`,
}))

export function buildSeedCashRegister(cashierId: string): CashRegister {
  return {
    id: 'cash-1',
    tenant_id: T,
    sucursal_id: S,
    cashier_id: cashierId,
    opening_amount: 2000,
    status: 'abierta',
    opened_at: new Date().toISOString(),
  }
}
