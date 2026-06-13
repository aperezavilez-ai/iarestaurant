import { supabase } from '@/lib/supabase'
import type { Ingredient, StockMovement } from '@/types/demo'

function mapIngredient(row: Record<string, unknown>): Ingredient {
  return {
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    name: row.name as string,
    unit: row.unit as string,
    stock: Number(row.stock),
    min_stock: Number(row.min_stock),
    cost: Number(row.cost),
    supplier_id: row.supplier_id as string | undefined,
  }
}

function mapMovement(row: Record<string, unknown>): StockMovement {
  const ing = row.ingredients as { name?: string } | null
  return {
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    ingredient_id: row.ingredient_id as string,
    ingredient_name: ing?.name ?? '',
    delta: Number(row.delta),
    reason: (row.reason as string) ?? '',
    created_at: row.created_at as string,
  }
}

export const inventoryService = {
  async getIngredients(tenantId: string): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return (data || []).map((r) => mapIngredient(r as Record<string, unknown>))
  },

  async getMovements(tenantId: string, limit = 50): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*, ingredients(name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data || []).map((r) => mapMovement(r as Record<string, unknown>))
  },

  async adjustStock(
    tenantId: string,
    ingredientId: string,
    delta: number,
    reason: string,
    reference?: string
  ): Promise<void> {
    const { data: ing, error: fetchErr } = await supabase
      .from('ingredients')
      .select('stock')
      .eq('id', ingredientId)
      .single()
    if (fetchErr) throw fetchErr

    const newStock = Math.max(0, Number(ing.stock) + delta)
    const { error: updateErr } = await supabase
      .from('ingredients')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', ingredientId)
    if (updateErr) throw updateErr

    const { error: movErr } = await supabase.from('stock_movements').insert({
      tenant_id: tenantId,
      ingredient_id: ingredientId,
      delta,
      reason,
      reference,
    })
    if (movErr) throw movErr
  },
}
