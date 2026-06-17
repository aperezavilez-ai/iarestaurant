/** Lógica de división de cuenta — compartida por qa-rehearsal y qa-split */

export function buildEqualSplitParts(total, labels) {
  const n = labels.length
  if (n < 1) return []
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / n)
  const remainder = cents - base * n

  return labels.map((label, i) => {
    const partCents = base + (i === n - 1 ? remainder : 0)
    return {
      id: `part-${i}`,
      label: label.trim() || `Persona ${i + 1}`,
      amount: partCents / 100,
    }
  })
}

export function buildItemSplitParts(order, parts) {
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
    let amountCents
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
      id: `part-${idx}`,
      label: part.label.trim() || `Persona ${idx + 1}`,
      amount: amountCents / 100,
      item_ids: part.item_ids,
    }
  })
}

export function splitPartsTotal(parts) {
  return Math.round(parts.reduce((s, p) => s + p.amount, 0) * 100) / 100
}
