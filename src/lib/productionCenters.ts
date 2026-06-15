export const KITCHEN_CENTERS = [
  { id: 'all', label: 'Todos', categories: [] as string[] },
  { id: 'barra_caliente', label: 'Barra Caliente', categories: ['Tacos', 'Platillos', 'Entradas'] },
  { id: 'barra_fria', label: 'Barra Fría', categories: ['Cocteles'] },
  { id: 'bebidas', label: 'Bebidas', categories: ['Bebidas'] },
  { id: 'postres', label: 'Postres', categories: ['Postres'] },
  { id: 'souvenirs', label: 'Souvenirs', categories: ['Souvenirs'] },
] as const

export type KitchenCenterId = (typeof KITCHEN_CENTERS)[number]['id']

export const KITCHEN_CENTER_OPTIONS = KITCHEN_CENTERS.filter(c => c.id !== 'all')

export function kitchenCenterLabel(id: string | undefined | null): string {
  if (!id) return 'Sin asignar'
  return KITCHEN_CENTERS.find(c => c.id === id)?.label || id
}

export function suggestKitchenCenter(categoryName: string): KitchenCenterId {
  const n = categoryName.toLowerCase()
  if (n.includes('souvenir')) return 'souvenirs'
  if (n.includes('postre')) return 'postres'
  if (n.includes('bebida') || n.includes('cerveza')) return 'bebidas'
  if (n.includes('coctel') || n.includes('barra fr')) return 'barra_fria'
  if (n.includes('barra cal') || n.includes('taco') || n.includes('platillo') || n.includes('entrada')) return 'barra_caliente'
  return 'barra_caliente'
}

export function itemMatchesCenter(
  kitchenCenter: string | undefined | null,
  categoryName: string | undefined,
  centerId: KitchenCenterId
): boolean {
  if (centerId === 'all') return true
  if (kitchenCenter) return kitchenCenter === centerId
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
