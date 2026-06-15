import { Badge } from '@/components/ui/Badge'
import { formatCurrency, cn } from '@/lib/utils'
import { getProductImageUrl, GENERIC_FOOD_IMAGE } from '@/lib/productImages'
import type { Product } from '@/types'

interface ProductMenuCardProps {
  product: Product
  qtyInCart?: number
  disabled?: boolean
  onClick: () => void
}

export function ProductMenuCard({ product, qtyInCart, disabled, onClick }: ProductMenuCardProps) {
  const img = getProductImageUrl(product)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'product-tile rounded-xl overflow-hidden text-left bg-white border border-command-border',
        disabled && 'opacity-50'
      )}
    >
      <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden relative">
        <img
          src={img}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = GENERIC_FOOD_IMAGE
          }}
        />
        {qtyInCart ? (
          <Badge variant="amber" className="absolute top-2 right-2 text-[10px]">
            {qtyInCart}
          </Badge>
        ) : null}
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-slate-800 leading-tight line-clamp-2">{product.name}</p>
        {product.description && (
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{product.description}</p>
        )}
        <p className="text-brand-600 font-mono font-bold text-sm mt-2">{formatCurrency(product.price)}</p>
      </div>
    </button>
  )
}
