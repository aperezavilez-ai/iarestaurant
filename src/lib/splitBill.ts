import type { Order, OrderItem, OrderSplitPart } from '@/types'

/** Reparte total en N partes iguales (centavos al último). */
export function buildEqualSplitParts(total: number, labels: string[]): OrderSplitPart[] {
  const n = labels.length
  if (n < 1) return []
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / n)
  const remainder = cents - base * n

  return labels.map((label, i) => {
    const partCents = base + (i === n - 1 ? remainder : 0)
    return {
      id: crypto.randomUUID(),
      label: label.trim() || `Persona ${i + 1}`,
      amount: partCents / 100,
      paid_at: undefined,
    }
  })
}

export interface ItemSplitInput {
  label: string
  item_ids: string[]
}

/** Reparte total proporcional al subtotal de ítems asignados (IVA/descuento incluidos). */
export function buildItemSplitParts(
  order: Pick<Order, 'subtotal' | 'total' | 'items'>,
  parts: ItemSplitInput[]
): OrderSplitPart[] {
  const items = order.items || []
  const subtotal = order.subtotal || items.reduce((s, i) => s + i.subtotal, 0)
  const totalCents = Math.round(order.total * 100)

  const withSubtotals = parts.map((part, i) => {
    const partSubtotal = part.item_ids.reduce((s, id) => {
      const item = items.find((it) => it.id === id)
      return s + (item?.subtotal ?? 0)
    }, 0)
    return { ...part, partSubtotal, index: i }
  })

  let assignedCents = 0
  const lastIdx = withSubtotals.length - 1

  return withSubtotals.map((part, idx) => {
    let amountCents: number
    if (idx === lastIdx) {
      amountCents = totalCents - assignedCents
    } else if (subtotal <= 0) {
      amountCents = Math.floor(totalCents / withSubtotals.length)
      assignedCents += amountCents
    } else {
      amountCents = Math.round((part.partSubtotal / subtotal) * totalCents)
      assignedCents += amountCents
    }

    return {
      id: crypto.randomUUID(),
      label: part.label.trim() || `Persona ${idx + 1}`,
      amount: amountCents / 100,
      item_ids: part.item_ids,
      paid_at: undefined,
    }
  })
}

export function validateItemSplit(
  items: OrderItem[],
  parts: ItemSplitInput[]
): string | null {
  if (parts.length < 2) return 'Indica al menos 2 comensales'
  if (!items.length) return 'La orden no tiene productos'

  const assigned = new Set<string>()
  for (const part of parts) {
    for (const id of part.item_ids) {
      if (assigned.has(id)) return 'Cada producto solo puede asignarse a un comensal'
      if (!items.some((it) => it.id === id)) return 'Producto no encontrado en la orden'
      assigned.add(id)
    }
  }

  if (assigned.size !== items.length) return 'Asigna todos los productos a un comensal'

  const withItems = parts.filter((p) => p.item_ids.length > 0)
  if (withItems.length < 2) return 'Al menos 2 comensales deben tener productos'

  return null
}

export function splitPartsTotal(parts: OrderSplitPart[]): number {
  return Math.round(parts.reduce((s, p) => s + p.amount, 0) * 100) / 100
}

export function allPartsPaid(parts: OrderSplitPart[]): boolean {
  return parts.length > 0 && parts.every((p) => Boolean(p.paid_at))
}

export function partItemLabels(items: OrderItem[], itemIds?: string[]): string {
  if (!itemIds?.length) return ''
  return itemIds
    .map((id) => items.find((it) => it.id === id)?.product_name)
    .filter(Boolean)
    .join(', ')
}
