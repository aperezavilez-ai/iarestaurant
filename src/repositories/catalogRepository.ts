import { catalogService } from '@/services/catalogService'
import { localDb } from '@/lib/localDb'
import { withHybridList } from './base'
import { isSupabaseConfigured } from '@/lib/config'
import { withTimeout } from '@/lib/async'
import type { Product, Category } from '@/types'
import type { TenantContext } from '@/types/context'

async function remoteProducts(tenantId: string) {
  return withTimeout(catalogService.getProducts(tenantId)).catch(() => [] as Product[])
}

async function remoteCategories(tenantId: string) {
  return withTimeout(catalogService.getCategories(tenantId)).catch(() => [] as Category[])
}

const CATEGORY_COLORS = ['#f59000', '#16213e', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#a855f7']

function dedupeCategories(categories: Category[]): Category[] {
  const byName = new Map<string, Category>()
  for (const c of categories) {
    const key = c.name.trim().toLowerCase()
    const prev = byName.get(key)
    if (!prev) {
      byName.set(key, c)
      continue
    }
    const prevIsSeed = prev.id.startsWith('cat-')
    const curIsSeed = c.id.startsWith('cat-')
    if (prevIsSeed && !curIsSeed) byName.set(key, c)
    else if (!prevIsSeed && curIsSeed) continue
    else if (c.sort_order >= prev.sort_order) byName.set(key, c)
  }
  return Array.from(byName.values()).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
}

export const catalogRepository = {
  async getCategories(ctx: TenantContext): Promise<Category[]> {
    const merged = await withHybridList(
      () => localDb.getCategories(ctx.tenantId),
      () => remoteCategories(ctx.tenantId)
    )
    return dedupeCategories(merged)
  },

  async getProducts(ctx: TenantContext): Promise<Product[]> {
    return withHybridList(
      () => localDb.getProducts(ctx.tenantId),
      () => remoteProducts(ctx.tenantId)
    )
  },

  async createProduct(ctx: TenantContext, data: Partial<Product>): Promise<Product> {
    const product: Product = {
      id: crypto.randomUUID(),
      tenant_id: ctx.tenantId,
      sucursal_id: ctx.sucursalId,
      category_id: data.category_id!,
      name: data.name!,
      description: data.description,
      price: Number(data.price) || 0,
      cost: Number(data.cost) || 0,
      image_url: data.image_url,
      is_active: true,
      has_variants: false,
      preparation_time: data.preparation_time,
    }
    await localDb.saveProduct(product)
    if (isSupabaseConfigured()) {
      try {
        await catalogService.createProduct(product)
      } catch {
        await localDb.enqueueSync({ table: 'products', operation: 'insert', payload: product as never })
      }
    }
    return product
  },

  async createCategory(ctx: TenantContext, data: { name: string; color?: string; kitchen_center?: string }): Promise<Category> {
    const existing = await this.getCategories(ctx)
    const duplicate = existing.find(c => c.name.trim().toLowerCase() === data.name.trim().toLowerCase())
    if (duplicate) throw new Error(`Ya existe la categoría "${duplicate.name}"`)

    const sortOrder = existing.length
      ? Math.max(...existing.map(c => c.sort_order)) + 1
      : 1

    const category: Category = {
      id: crypto.randomUUID(),
      tenant_id: ctx.tenantId,
      sucursal_id: ctx.sucursalId,
      name: data.name.trim(),
      color: data.color || CATEGORY_COLORS[existing.length % CATEGORY_COLORS.length],
      sort_order: sortOrder,
      is_active: true,
      kitchen_center: data.kitchen_center,
    }

    await localDb.saveCategory(category)
    if (isSupabaseConfigured()) {
      try {
        await catalogService.createCategory(category)
      } catch {
        await localDb.enqueueSync({ table: 'categories', operation: 'insert', payload: category as never })
      }
    }
    return category
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const all = await localDb.getProducts(updates.tenant_id || '')
    const existing = all.find((p) => p.id === id)
    if (!existing) return
    const updated = { ...existing, ...updates }
    await localDb.saveProduct(updated)
    try {
      await catalogService.updateProduct(id, updates)
    } catch { /* sync later */ }
  },

  async deactivateProduct(ctx: TenantContext, id: string): Promise<void> {
    await this.updateProduct(id, { tenant_id: ctx.tenantId, is_active: false })
  },
}
