import { useEffect, useState } from 'react'
import { ExternalLink, QrCode, Loader2 } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { getProductImageUrl } from '@/lib/productImages'
import { useTenantContext } from '@/hooks/useTenantContext'
import { useAuthStore } from '@/store/authStore'
import { catalogRepository } from '@/repositories/catalogRepository'
import type { Category, Product } from '@/types'

export default function GuestMenuPreviewPage() {
  const ctx = useTenantContext()
  const tenant = useAuthStore((s) => s.tenant)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const demoUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/comensal?mesa=5` : '/comensal?mesa=5'

  useEffect(() => {
    if (!ctx) return
    setLoading(true)
    Promise.all([
      catalogRepository.getProducts(ctx),
      catalogRepository.getCategories(ctx),
    ])
      .then(([prods, cats]) => {
        setProducts(prods.filter((p) => p.is_active))
        setCategories(cats.filter((c) => c.is_active))
      })
      .finally(() => setLoading(false))
  }, [ctx])

  return (
    <div className="space-y-5">
      <Card className="p-4 bg-brand-50/60 border-brand-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-800">Vista del comensal (QR)</p>
            <p className="text-sm text-slate-600 mt-1">
              Así ve el cliente al escanear el código en la mesa: solo nombre y precio, sin costos ni márgenes.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href={demoUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink size={14} /> Abrir en celular
              </Button>
            </a>
            <a href="/app/qr">
              <Button size="sm" className="gap-2">
                <QrCode size={14} /> Códigos QR
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Cargando menú…
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-full max-w-md rounded-3xl border-4 border-slate-200 bg-command-bg shadow-panel overflow-hidden">
            <header className="gradient-amber text-white p-4">
              <p className="text-[10px] opacity-80 uppercase tracking-widest">Menú digital</p>
              <p className="font-black text-lg">{tenant?.name || 'IA·RESTAURANT'}</p>
              <p className="text-xs opacity-80 mt-1">Mesa demo · Salón principal</p>
            </header>

            <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
              {categories.length === 0 && products.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-8">No hay productos activos en el catálogo.</p>
              )}

              {categories.map((cat) => {
                const items = products.filter((p) => p.category_id === cat.id)
                if (!items.length) return null
                return (
                  <section key={cat.id}>
                    <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest mb-3">{cat.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((p) => (
                        <div
                          key={p.id}
                          className="product-tile rounded-xl overflow-hidden bg-white border border-command-border"
                        >
                          <div className="aspect-[4/3] bg-slate-100">
                            <img
                              src={getProductImageUrl(p)}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-bold text-slate-800 leading-tight">{p.name}</p>
                            {p.description && (
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                            )}
                            <p className="text-brand-600 font-mono font-bold text-sm mt-2">{formatCurrency(p.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}

              {products.filter((p) => !categories.some((c) => c.id === p.category_id)).length > 0 && (
                <section>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Otros</p>
                  <div className="grid grid-cols-2 gap-2">
                    {products
                      .filter((p) => !categories.some((c) => c.id === p.category_id))
                      .map((p) => (
                        <div key={p.id} className="product-tile rounded-xl overflow-hidden bg-white border border-command-border">
                          <div className="aspect-[4/3] bg-slate-100">
                            <img src={getProductImageUrl(p)} alt="" loading="lazy" className="w-full h-full object-cover" />
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-bold text-slate-800">{p.name}</p>
                            <p className="text-brand-600 font-mono font-bold text-sm mt-2">{formatCurrency(p.price)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              )}
            </div>

            <div className="border-t border-command-border bg-white p-3 text-center">
              <Badge variant="amber" className="text-[10px]">Vista previa · sin pedido</Badge>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardBody className="text-sm text-slate-600 space-y-2">
          <p><strong>Catálogo</strong> = lo que gestionas (precio, costo, estado).</p>
          <p><strong>Menú comensal</strong> = lo que publicas al cliente (solo activos).</p>
          <p>Desactiva un producto en Catálogo y desaparece aquí y en el QR.</p>
        </CardBody>
      </Card>
    </div>
  )
}
