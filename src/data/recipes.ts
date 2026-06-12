/** Recetas simplificadas: producto → ingredientes descontados al vender/enviar a cocina */
export const PRODUCT_RECIPES: Record<string, { ingredient_id: string; qty: number }[]> = {
  p1: [{ ingredient_id: 'ing1', qty: 3 }, { ingredient_id: 'ing2', qty: 0.12 }],
  p2: [{ ingredient_id: 'ing1', qty: 3 }, { ingredient_id: 'ing2', qty: 0.15 }],
  p3: [{ ingredient_id: 'ing1', qty: 4 }, { ingredient_id: 'ing3', qty: 0.08 }],
  p4: [{ ingredient_id: 'ing2', qty: 0.2 }],
  p5: [{ ingredient_id: 'ing3', qty: 0.15 }],
  p7: [{ ingredient_id: 'ing6', qty: 0.05 }],
  p10: [{ ingredient_id: 'ing5', qty: 1 }],
  p11: [{ ingredient_id: 'ing4', qty: 0.05 }, { ingredient_id: 'ing6', qty: 0.03 }],
  p12: [{ ingredient_id: 'ing5', qty: 1 }, { ingredient_id: 'ing6', qty: 0.05 }],
}
