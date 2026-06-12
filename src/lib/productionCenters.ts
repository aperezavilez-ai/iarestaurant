export const KITCHEN_CENTERS = [
  { id: 'all', label: 'Todos', categories: [] as string[] },
  { id: 'cocina_caliente', label: 'Cocina Caliente', categories: ['Tacos', 'Platillos', 'Entradas'] },
  { id: 'barra', label: 'Barra', categories: ['Bebidas', 'Cocteles'] },
  { id: 'postres', label: 'Postres', categories: ['Postres'] },
] as const

export type KitchenCenterId = (typeof KITCHEN_CENTERS)[number]['id']

export function itemMatchesCenter(categoryName: string | undefined, centerId: KitchenCenterId): boolean {
  if (centerId === 'all') return true
  const center = KITCHEN_CENTERS.find(c => c.id === centerId)
  if (!center) return true
  return center.categories.some(c => categoryName?.includes(c) || c === categoryName)
}

export function getProductCategory(productId: string, productName: string): string {
  const map: Record<string, string> = {
    p1: 'Tacos', p2: 'Tacos', p3: 'Platillos', p4: 'Platillos', p5: 'Entradas', p6: 'Entradas',
    p7: 'Bebidas', p8: 'Bebidas', p9: 'Bebidas', p10: 'Bebidas', p11: 'Cocteles', p12: 'Cocteles',
    p13: 'Postres', p14: 'Postres',
  }
  return map[productId] || productName.split(' ')[0]
}
