import { useEffect, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatCurrency, cn } from '@/lib/utils'
import { getProductImageUrl, NOTE_CHIPS, MAX_ITEM_NOTE_LENGTH } from '@/lib/productImages'
import type { Product } from '@/types'

interface ProductAddSheetProps {
  product: Product | null
  open: boolean
  onClose: () => void
  onAdd: (qty: number, notes: string) => void
}

export function ProductAddSheet({ product, open, onClose, onAdd }: ProductAddSheetProps) {
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open && product) {
      setQty(1)
      setNotes('')
    }
  }, [open, product?.id])

  if (!open || !product) return null

  const toggleChip = (chip: string) => {
    setNotes((prev) => {
      const parts = prev.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean)
      if (parts.includes(chip)) return parts.filter((p) => p !== chip).join(', ')
      return [...parts, chip].join(', ')
    })
  }

  const chipActive = (chip: string) =>
    notes.split(/[,;]\s*/).some((p) => p.trim() === chip)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl shadow-panel max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-100 text-slate-600 z-10"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="aspect-[16/9] w-full bg-slate-100">
          <img
            src={getProductImageUrl(product)}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-5 space-y-4 pb-8">
          <div>
            <p className="font-black text-lg text-slate-800">{product.name}</p>
            <p className="text-brand-600 font-mono font-bold text-lg mt-1">{formatCurrency(product.price)}</p>
            {product.description && (
              <p className="text-sm text-slate-600 mt-2">{product.description}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <Minus size={16} />
            </button>
            <span className="font-black text-2xl w-8 text-center">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center"
            >
              <Plus size={16} />
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Nota para cocina
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, MAX_ITEM_NOTE_LENGTH))}
              placeholder="Ej. sin cebolla, alergia a nuez…"
              rows={2}
              className="mt-2 w-full rounded-xl border border-command-border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">{notes.length}/{MAX_ITEM_NOTE_LENGTH}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {NOTE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(chip)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                  chipActive(chip)
                    ? 'bg-brand-100 border-brand-400 text-brand-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                )}
              >
                {chip}
              </button>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={() => {
              onAdd(qty, notes.trim())
              onClose()
            }}
          >
            Agregar · {formatCurrency(product.price * qty)}
          </Button>
        </div>
      </div>
    </div>
  )
}
