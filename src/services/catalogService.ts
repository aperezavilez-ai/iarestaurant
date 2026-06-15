import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types'

export const catalogService = {
  async getCategories(tenantId: string): Promise<Category[]> {
    const { data } = await supabase
      .from('categories').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('sort_order')
    return data || []
  },
  async createCategory(category: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase.from('categories').insert(category).select().single()
    if (error) throw error
    return data
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    await supabase.from('categories').update(updates).eq('id', id)
  },
  async getProducts(tenantId: string, categoryId?: string): Promise<Product[]> {
    let q = supabase.from('products').select('*, category:categories(*)').eq('tenant_id', tenantId).eq('is_active', true)
    if (categoryId) q = q.eq('category_id', categoryId)
    const { data } = await q.order('name')
    return data || []
  },
  async createProduct(product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase.from('products').insert(product).select().single()
    if (error) throw error
    return data
  },
  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    await supabase.from('products').update(updates).eq('id', id)
  },
  async deleteProduct(id: string): Promise<void> {
    await supabase.from('products').update({ is_active: false }).eq('id', id)
  },
}
