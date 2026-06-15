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

export const catalogRepository = {
  async getCategories(ctx: TenantContext): Promise<Category[]> {
    return withHybridList(
      () => localDb.getCategories(ctx.tenantId),
      () => remoteCategories(ctx.tenantId)
    )
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
