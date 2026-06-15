import type { Product } from '@/types'

/** Fotos demo (Unsplash) — fallback si el producto no tiene image_url en BD */
const BY_NAME: Record<string, string> = {
  'Tacos de Pastor': 'https://images.unsplash.com/photo-1565299585323-38174c0a5e73?w=400&q=80',
  'Tacos de Bistec': 'https://images.unsplash.com/photo-1551504738-cee027f75213?w=400&q=80',
  'Enchiladas Verdes': 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400&q=80',
  'Pozole Rojo': 'https://images.unsplash.com/photo-1599974129793-fabb78a32f34?w=400&q=80',
  Guacamole: 'https://images.unsplash.com/photo-1628191010210-a59de9c2efc5?w=400&q=80',
  'Queso Fundido': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32e?w=400&q=80',
  'Agua de Jamaica': 'https://images.unsplash.com/photo-1622597467836-f32821f8271b?w=400&q=80',
  Horchata: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
  Refresco: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=80',
  Cerveza: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80',
  'Margarita Clásica': 'https://images.unsplash.com/photo-1555633724-dab1d64b9a75?w=400&q=80',
  Michelada: 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=400&q=80',
  'Flan Napolitano': 'https://images.unsplash.com/photo-1551024602-b22ff4a0816d?w=400&q=80',
  Churros: 'https://images.unsplash.com/photo-1551024926-7fb043ee4ec6?w=400&q=80',
}

const BY_CATEGORY: Record<string, string> = {
  'cat-tacos': BY_NAME['Tacos de Pastor'],
  '00000000-0000-0000-0000-000000000101': BY_NAME['Tacos de Pastor'],
  'cat-platillos': BY_NAME['Enchiladas Verdes'],
  '00000000-0000-0000-0000-000000000102': BY_NAME['Enchiladas Verdes'],
  'cat-entradas': BY_NAME.Guacamole,
  '00000000-0000-0000-0000-000000000103': BY_NAME.Guacamole,
  'cat-bebidas': BY_NAME['Agua de Jamaica'],
  '00000000-0000-0000-0000-000000000104': BY_NAME['Agua de Jamaica'],
  'cat-cocteles': BY_NAME['Margarita Clásica'],
  '00000000-0000-0000-0000-000000000105': BY_NAME['Margarita Clásica'],
  'cat-postres': BY_NAME['Flan Napolitano'],
  '00000000-0000-0000-0000-000000000106': BY_NAME['Flan Napolitano'],
}

export const GENERIC_FOOD_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'

export function getProductImageUrl(product: Pick<Product, 'name' | 'image_url' | 'category_id'>): string {
  if (product.image_url?.trim()) return product.image_url.trim()
  return BY_NAME[product.name] || BY_CATEGORY[product.category_id] || GENERIC_FOOD_IMAGE
}

export const NOTE_CHIPS = [
  'Sin cebolla',
  'Sin picante',
  'Extra salsa',
  'Bien cocido',
  'Sin cilantro',
] as const

export const MAX_ITEM_NOTE_LENGTH = 120
