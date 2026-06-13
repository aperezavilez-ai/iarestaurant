import { useOpsDataStore } from '@/store/opsDataStore'
import { PRODUCT_RECIPES } from '@/data/recipes'
import { inventoryService } from '@/services/inventoryService'
import { isSupabaseConfigured } from '@/lib/config'
import { withHybridList } from '@/repositories/base'
import type { Ingredient, StockMovement } from '@/types/demo'
import type { CartLine } from '@/repositories/orderRepository'
import type { TenantContext } from '@/types/context'

export const inventoryRepository = {
  async ensureLoaded(ctx: TenantContext): Promise<void> {
    useOpsDataStore.getState().resetIfEmpty()
    if (!isSupabaseConfigured()) return

    const [ingredients, movements] = await Promise.all([
      withHybridList(
        () => Promise.resolve(useOpsDataStore.getState().ingredients),
        () => inventoryService.getIngredients(ctx.tenantId)
      ),
      withHybridList(
        () => Promise.resolve(useOpsDataStore.getState().movements),
        () => inventoryService.getMovements(ctx.tenantId)
      ),
    ])
    useOpsDataStore.getState().hydrateInventory(ingredients, movements)
  },

  getIngredients(): Ingredient[] {
    useOpsDataStore.getState().resetIfEmpty()
    return useOpsDataStore.getState().ingredients
  },

  getLowStock(): Ingredient[] {
    return this.getIngredients().filter((i) => i.stock <= i.min_stock)
  },

  getMovements(): StockMovement[] {
    return useOpsDataStore.getState().movements
  },

  async adjustStock(ctx: TenantContext, ingredientId: string, delta: number, reason: string): Promise<void> {
    useOpsDataStore.getState().adjustStock(ingredientId, delta, reason)
    if (isSupabaseConfigured()) {
      try {
        await inventoryService.adjustStock(ctx.tenantId, ingredientId, delta, reason)
      } catch {
        /* local ya aplicado */
      }
    }
  },

  async deductForOrder(ctx: TenantContext, lines: CartLine[], folio: string): Promise<void> {
    for (const line of lines) {
      const recipe = PRODUCT_RECIPES[line.product_id]
      if (!recipe) continue
      for (const part of recipe) {
        await this.adjustStock(
          ctx,
          part.ingredient_id,
          -(part.qty * line.quantity),
          `Venta ${folio}`
        )
      }
    }
  },

  getInventoryValue(): number {
    return this.getIngredients().reduce((s, i) => s + i.stock * i.cost, 0)
  },
}
