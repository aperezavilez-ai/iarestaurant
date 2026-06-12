export { DEMO_TENANT_ID, DEMO_SUCURSAL_ID, DEMO_ORG_ID } from '@/lib/config'

export const TAX_RATE = 0.16

export const CATEGORY_EMOJI: Record<string, string> = {
  Tacos: '🌮',
  Platillos: '🫔',
  Entradas: '🥑',
  Bebidas: '🥤',
  Cocteles: '🍹',
  Postres: '🍮',
}

export function getCategoryEmoji(name?: string): string {
  return (name && CATEGORY_EMOJI[name]) || '🍽️'
}
