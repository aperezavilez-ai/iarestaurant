import { useOpsDataStore } from '@/store/opsDataStore'
import { PRODUCT_RECIPES } from '@/data/recipes'
import type { Ingredient, StockMovement } from '@/types/demo'
import type { CartLine } from '@/repositories/orderRepository'

export const inventoryRepository = {
  getIngredients(): Ingredient[] {
    useOpsDataStore.getState().resetIfEmpty()
    return useOpsDataStore.getState().ingredients
  },

  getLowStock(): Ingredient[] {
    return this.getIngredients().filter(i => i.stock <= i.min_stock)
  },

  getMovements(): StockMovement[] {
    return useOpsDataStore.getState().movements
  },

  adjustStock(ingredientId: string, delta: number, reason: string): void {
    useOpsDataStore.getState().adjustStock(ingredientId, delta, reason)
  },

  deductForOrder(lines: CartLine[], folio: string): void {
    const store = useOpsDataStore.getState()
    for (const line of lines) {
      const recipe = PRODUCT_RECIPES[line.product_id]
      if (!recipe) continue
      for (const part of recipe) {
        store.adjustStock(part.ingredient_id, -(part.qty * line.quantity), `Venta ${folio}`)
      }
    }
  },

  getInventoryValue(): number {
    return this.getIngredients().reduce((s, i) => s + i.stock * i.cost, 0)
  },
}
