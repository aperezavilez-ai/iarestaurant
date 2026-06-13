/** Recetas: producto → ingredientes descontados al vender/enviar a cocina (UUIDs Supabase) */
const P = {
  tacosPastor: '00000000-0000-0000-0000-000000000201',
  tacosBistec: '00000000-0000-0000-0000-000000000202',
  enchiladas: '00000000-0000-0000-0000-000000000203',
  pozole: '00000000-0000-0000-0000-000000000204',
  guacamole: '00000000-0000-0000-0000-000000000205',
  jamaica: '00000000-0000-0000-0000-000000000206',
  margarita: '00000000-0000-0000-0000-000000000207',
  churros: '00000000-0000-0000-0000-000000000214',
} as const

const I = {
  tortilla: '00000000-0000-0000-0000-000000000501',
  carne: '00000000-0000-0000-0000-000000000502',
  aguacate: '00000000-0000-0000-0000-000000000503',
  tequila: '00000000-0000-0000-0000-000000000504',
  cerveza: '00000000-0000-0000-0000-000000000505',
  limon: '00000000-0000-0000-0000-000000000506',
  queso: '00000000-0000-0000-0000-000000000507',
  arroz: '00000000-0000-0000-0000-000000000508',
} as const

export const PRODUCT_RECIPES: Record<string, { ingredient_id: string; qty: number }[]> = {
  [P.tacosPastor]: [{ ingredient_id: I.tortilla, qty: 3 }, { ingredient_id: I.carne, qty: 0.12 }],
  [P.tacosBistec]: [{ ingredient_id: I.tortilla, qty: 3 }, { ingredient_id: I.carne, qty: 0.15 }],
  [P.enchiladas]: [{ ingredient_id: I.tortilla, qty: 4 }, { ingredient_id: I.queso, qty: 0.08 }],
  [P.pozole]: [{ ingredient_id: I.carne, qty: 0.2 }, { ingredient_id: I.arroz, qty: 0.05 }],
  [P.guacamole]: [{ ingredient_id: I.aguacate, qty: 0.15 }],
  [P.margarita]: [{ ingredient_id: I.tequila, qty: 0.05 }, { ingredient_id: I.limon, qty: 0.03 }],
  [P.jamaica]: [{ ingredient_id: I.limon, qty: 0.05 }],
  [P.churros]: [{ ingredient_id: I.arroz, qty: 0.02 }],
}
