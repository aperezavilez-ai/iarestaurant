import { useEffect, useState, useRef } from 'react'
import { Plus, Search, Edit, Trash2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import { useTenantContext } from '@/hooks/useTenantContext'
import { catalogRepository } from '@/repositories/catalogRepository'
import { imageUploadService } from '@/services/imageUploadService'
import { getProductImageUrl } from '@/lib/productImages'
import type { Product, Category } from '@/types'

export default function CatalogPage() {
  const ctx = useTenantContext()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', price: '', cost: '', category_id: '', image_url: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    if (!ctx) return
    const [prods, cats] = await Promise.all([
      catalogRepository.getProducts(ctx),
      catalogRepository.getCategories(ctx),
    ])
    setProducts(prods)
    setCategories(cats)
  }

  useEffect(() => { load() }, [ctx])

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const openNew = () => {
    setEditProduct(null)
    setForm({ name: '', price: '', cost: '', category_id: categories[0]?.id || '', image_url: '' })
    setPendingFile(null)
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({ name: p.name, price: String(p.price), cost: String(p.cost), category_id: p.category_id, image_url: p.image_url || '' })
    setPendingFile(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!ctx || !form.name || !form.category_id) return
    setSaving(true)
    try {
      if (editProduct) {
        await catalogRepository.updateProduct(editProduct.id, {
          tenant_id: ctx.tenantId,
          name: form.name,
          price: Number(form.price),
          cost: Number(form.cost),
          category_id: form.category_id,
          image_url: form.image_url || undefined,
        })
        toast('Producto actualizado', 'success')
      } else {
        const created = await catalogRepository.createProduct(ctx, {
          name: form.name,
          price: Number(form.price),
          cost: Number(form.cost),
          category_id: form.category_id,
          image_url: form.image_url || undefined,
        })
        if (pendingFile) {
          const url = await imageUploadService.uploadProductImage(pendingFile, ctx.tenantId, created.id)
          await catalogRepository.updateProduct(created.id, { tenant_id: ctx.tenantId, image_url: url })
        }
        toast('Producto creado', 'success')
      }
      setShowModal(false)
      await load()
    } catch {
      toast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!ctx) return
    await catalogRepository.deactivateProduct(ctx, id)
    toast('Producto desactivado', 'warning')
    await load()
  }

  const handleImageUpload = async (file: File) => {
    if (!ctx) return
    if (!editProduct) {
      setPendingFile(file)
      setForm((f) => ({ ...f, image_url: URL.createObjectURL(file) }))
      return
    }
    setUploading(true)
    try {
      const url = await imageUploadService.uploadProductImage(file, ctx.tenantId, editProduct.id)
      setForm((f) => ({ ...f, image_url: url }))
      toast('Imagen subida', 'success')
    } catch {
      toast('No se pudo subir la imagen', 'error')
    } finally {
      setUploading(false)
    }
  }

  const margin = (price: number, cost: number) => price > 0 ? Math.round((1 - cost / price) * 100) : 0

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Input placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={15} />} className="max-w-xs" />
            <Button onClick={openNew}><Plus size={15} /> Nuevo producto</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-command-border">
              <tr>
                {['Foto', 'Producto', 'Categoría', 'Precio', 'Costo', 'Margen', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-command-border">
              {filtered.map(p => (
                <tr key={p.id} className={cn('hover:bg-command-elevated/50', !p.is_active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <img
                      src={getProductImageUrl(p)}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                  <td className="px-4 py-3"><Badge>{p.category?.name}</Badge></td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatCurrency(p.cost)}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">{margin(p.price, p.cost)}%</td>
                  <td className="px-4 py-3"><Badge variant={p.is_active ? 'success' : 'default'}>{p.is_active ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editProduct ? 'Editar producto' : 'Nuevo producto'}>
        <div className="p-5 space-y-4">
          <Input label="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <Input label="Costo" type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
            <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full rounded-xl border border-command-border bg-white text-slate-800 px-3 py-2.5 text-sm">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Foto del platillo</label>
            <div className="flex items-center gap-3">
              {(form.image_url || editProduct) && (
                <img
                  src={form.image_url || (editProduct ? getProductImageUrl(editProduct) : '')}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-command-border"
                />
              )}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                    e.target.value = ''
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageIcon size={14} /> Subir imagen
                </Button>
                <Input
                  placeholder="O pega URL de imagen"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
