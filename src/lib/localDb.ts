import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  Category,
  Product,
  RestaurantTable,
  TableArea,
  Order,
  OrderItem,
  Payment,
  CashRegister,
  Sucursal,
  Organization,
  Tenant,
} from '@/types'
import {
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_TABLES,
  SEED_AREAS,
  SEED_ORDERS,
  SEED_ORDER_ITEMS,
  SEED_TENANT,
  SEED_ORGANIZATION,
  SEED_SUCURSAL,
  SEED_SUCURSALES,
} from '@/data/seed'

export interface SyncQueueItem {
  id: string
  table: string
  operation: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
  created_at: string
}

interface IARestaurantDB extends DBSchema {
  meta: { key: string; value: { initialized: boolean; version: number } }
  tenants: { key: string; value: Tenant }
  organizations: { key: string; value: Organization }
  sucursales: { key: string; value: Sucursal }
  categories: { key: string; value: Category }
  products: { key: string; value: Product }
  table_areas: { key: string; value: TableArea }
  tables: { key: string; value: RestaurantTable }
  orders: { key: string; value: Order }
  order_items: { key: string; value: OrderItem }
  payments: { key: string; value: Payment }
  cash_registers: { key: string; value: CashRegister }
  sync_queue: { key: string; value: SyncQueueItem }
}

const DB_NAME = 'ia-restaurant'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<IARestaurantDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<IARestaurantDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const stores = [
          'meta', 'tenants', 'organizations', 'sucursales', 'categories',
          'products', 'table_areas', 'tables', 'orders', 'order_items',
          'payments', 'cash_registers', 'sync_queue',
        ] as const
        stores.forEach((s) => {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s)
        })
      },
    })
  }
  return dbPromise
}

type StoreName =
  | 'tenants' | 'organizations' | 'sucursales' | 'categories' | 'products'
  | 'table_areas' | 'tables' | 'orders' | 'order_items' | 'payments'
  | 'cash_registers' | 'sync_queue'

async function putAll(store: StoreName, items: { id: string }[]) {
  const db = await getDb()
  const tx = db.transaction(store, 'readwrite')
  await Promise.all(items.map((item) => tx.store.put(item as never, item.id)))
  await tx.done
}

async function getAll<S extends StoreName>(store: S): Promise<IARestaurantDB[S]['value'][]> {
  const db = await getDb()
  return db.getAll(store) as Promise<IARestaurantDB[S]['value'][]>
}

export async function ensureLocalSeed(): Promise<void> {
  const db = await getDb()
  const meta = await db.get('meta', 'app')
  if (meta?.initialized) return

  await putAll('tenants', [SEED_TENANT])
  await putAll('organizations', [SEED_ORGANIZATION])
  await putAll('sucursales', SEED_SUCURSALES)
  await putAll('categories', SEED_CATEGORIES)
  await putAll('products', SEED_PRODUCTS)
  await putAll('table_areas', SEED_AREAS)
  await putAll('tables', SEED_TABLES)
  await putAll('orders', SEED_ORDERS)
  await putAll('order_items', SEED_ORDER_ITEMS)
  await db.put('meta', { initialized: true, version: 1 }, 'app')
}

export async function resetLocalData(): Promise<void> {
  const db = await getDb()
  const stores = [
    'tenants', 'organizations', 'sucursales', 'categories', 'products',
    'table_areas', 'tables', 'orders', 'order_items', 'payments', 'cash_registers', 'sync_queue',
  ] as const
  for (const s of stores) await db.clear(s)
  await db.delete('meta', 'app')
  await ensureLocalSeed()
}

export const localDb = {
  ensureLocalSeed,
  resetLocalData,

  async getTenant(id: string) {
    const db = await getDb()
    return db.get('tenants', id)
  },

  async getSucursal(id: string) {
    const db = await getDb()
    return db.get('sucursales', id)
  },

  async getSucursales(tenantId: string) {
    const all = await getAll('sucursales')
    return all.filter((s) => s.tenant_id === tenantId)
  },

  async getOrganization(tenantId: string) {
    const all = await getAll('organizations')
    return all.find((o) => o.tenant_id === tenantId)
  },

  async getCategories(tenantId: string) {
    const all = await getAll('categories')
    return all.filter((c) => c.tenant_id === tenantId && c.is_active).sort((a, b) => a.sort_order - b.sort_order)
  },

  async getProducts(tenantId: string) {
    const all = await getAll('products')
    const categories = await this.getCategories(tenantId)
    return all
      .filter((p) => p.tenant_id === tenantId)
      .map((p) => ({ ...p, category: categories.find((c) => c.id === p.category_id) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  },

  async saveProduct(product: Product) {
    const db = await getDb()
    await db.put('products', product)
  },

  async saveCategory(category: Category) {
    const db = await getDb()
    await db.put('categories', category)
  },

  async saveArea(area: TableArea) {
    const db = await getDb()
    await db.put('table_areas', area)
  },

  async getAreas(tenantId: string, sucursalId: string) {
    const all = await getAll('table_areas')
    return all
      .filter((a) => a.tenant_id === tenantId && a.sucursal_id === sucursalId && a.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
  },

  async getTables(tenantId: string, sucursalId: string) {
    const all = await getAll('tables')
    const areas = await getAll('table_areas')
    return all
      .filter((t) => t.tenant_id === tenantId && t.sucursal_id === sucursalId)
      .map((t) => ({ ...t, area: areas.find((a) => a.id === t.area_id) }))
      .sort((a, b) => a.number - b.number)
  },

  async updateTable(table: RestaurantTable) {
    const db = await getDb()
    await db.put('tables', table)
  },

  async getOrders(tenantId: string, sucursalId: string) {
    const all = await getAll('orders')
    const items = await getAll('order_items')
    return all
      .filter((o) => o.tenant_id === tenantId && o.sucursal_id === sucursalId)
      .map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async getActiveOrders(tenantId: string, sucursalId: string) {
    const orders = await this.getOrders(tenantId, sucursalId)
    return orders.filter((o) => ['abierta', 'en_preparacion', 'lista'].includes(o.status))
  },

  async saveOrder(order: Order, items: OrderItem[]) {
    const db = await getDb()
    const tx = db.transaction(['orders', 'order_items'], 'readwrite')
    await tx.objectStore('orders').put(order)
    for (const item of items) await tx.objectStore('order_items').put(item)
    await tx.done
  },

  async updateOrder(order: Order) {
    const db = await getDb()
    await db.put('orders', order)
  },

  async updateOrderItem(item: OrderItem) {
    const db = await getDb()
    await db.put('order_items', item)
  },

  async findOrderItem(itemId: string): Promise<OrderItem | undefined> {
    const all = await getAll('order_items')
    return all.find((i) => i.id === itemId)
  },

  async savePayment(payment: Payment) {
    const db = await getDb()
    await db.put('payments', payment)
  },

  async getPayments(tenantId: string) {
    const all = await getAll('payments')
    return all.filter(p => p.tenant_id === tenantId)
  },

  async getPaymentsToday(tenantId: string, sucursalId: string) {
    const all = await getAll('payments')
    const today = new Date().toISOString().slice(0, 10)
    const orders = await this.getOrders(tenantId, sucursalId)
    const orderIds = new Set(orders.filter((o) => o.status === 'cobrada' && o.created_at.startsWith(today)).map((o) => o.id))
    return all.filter((p) => p.tenant_id === tenantId && orderIds.has(p.order_id))
  },

  async getOpenCashRegister(tenantId: string, sucursalId: string): Promise<CashRegister | null> {
    const all = await getAll('cash_registers')
    return all.find((c) => c.tenant_id === tenantId && c.sucursal_id === sucursalId && c.status === 'abierta') ?? null
  },

  async saveCashRegister(register: CashRegister) {
    const db = await getDb()
    await db.put('cash_registers', register)
  },

  async enqueueSync(item: Omit<SyncQueueItem, 'id' | 'created_at'>) {
    const db = await getDb()
    const entry: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    await db.put('sync_queue', entry)
    return entry
  },

  async getSyncQueue() {
    return getAll('sync_queue')
  },

  async removeSyncItem(id: string) {
    const db = await getDb()
    await db.delete('sync_queue', id)
  },
}
