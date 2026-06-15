import { useEffect, useState, useRef } from 'react'
import { Plus, Search, Edit, Trash2, ImageIcon, Pencil } from 'lucide-react'
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
import { KITCHEN_CENTER_OPTIONS, kitchenCenterLabel, suggestKitchenCenter } from '@/lib/productionCenters'
import type { Product, Category } from '@/types'

export default function CatalogPage() {
  const ctx = useTenantContext()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryColor, setCategoryColor] = useState('#f59000')
  const [categoryKitchen, setCategoryKitchen] = useState('barra_caliente')
  const [savingCategory, setSavingCategory] = useState(false)
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

  const CATEGORY_COLORS = ['#f59000', '#16213e', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#a855f7']

  const openNewCategory = () => {
    setEditCategory(null)
    setCategoryName('')
    setCategoryColor(CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length])
    setCategoryKitchen('barra_caliente')
    setShowCategoryModal(true)
  }

  const openEditCategory = (c: Category) => {
    setEditCategory(c)
    setCategoryName(c.name)
    setCategoryColor(c.color)
    setCategoryKitchen(c.kitchen_center || 'barra_caliente')
    setShowCategoryModal(true)
  }

  const handleCreateCategory = async () => {
    if (!ctx || !categoryName.trim()) return
    setSavingCategory(true)
    try {
      if (editCategory) {
        const updated = await catalogRepository.updateCategory(ctx, editCategory.id, {
          name: categoryName,
          color: categoryColor,
          kitchen_center: categoryKitchen,
        })
        toast(`Categoría "${updated.name}" actualizada`, 'success')
      } else {
        const created = await catalogRepository.createCategory(ctx, {
          name: categoryName,
          color: categoryColor,
          kitchen_center: categoryKitchen,
        })
        toast(`Categoría "${created.name}" creada`, 'success')
        setForm(f => ({ ...f, category_id: created.id }))
      }
      setShowCategoryModal(false)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar la categoría', 'error')
    } finally {
      setSavingCategory(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-slate-800">Categorías del menú</p>
              <p className="text-xs text-slate-500">Alta aquí — aparecen al crear o editar productos</p>
            </div>
            <Button variant="outline" size="sm" onClick={openNewCategory}>
              <Plus size={14} /> Nueva categoría
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500">Sin categorías. Crea la primera para organizar tu menú.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-command-border bg-white text-sm font-semibold text-slate-800"
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span>{c.name}</span>
                  {c.kitchen_center && (
                    <Badge variant="info" className="text-[9px]">{kitchenCenterLabel(c.kitchen_center)}</Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditCategory(c)}
                    className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                    title="Editar categoría"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">Categoría</label>
              <button
                type="button"
                onClick={openNewCategory}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                + Nueva categoría
              </button>
            </div>
            <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full rounded-xl border border-command-border bg-white text-slate-800 px-3 py-2.5 text-sm">
              {categories.length === 0 && <option value="">Sin categorías — crea una primero</option>}
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
            <Button className="flex-1" loading={saving} onClick={handleSave} disabled={!categories.length}>Guardar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editCategory ? 'Editar categoría' : 'Nueva categoría'} size="sm">
        <div className="p-5 space-y-4">
          <Input
            label="Nombre de la categoría"
            placeholder="Ej. Barra Caliente, Souvenirs, Bebidas..."
            value={categoryName}
            onChange={e => {
              const name = e.target.value
              setCategoryName(name)
              if (name.trim()) setCategoryKitchen(suggestKitchenCenter(name))
            }}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Área de cocina (KDS)</label>
            <select
              value={categoryKitchen}
              onChange={e => setCategoryKitchen(e.target.value)}
              className="w-full rounded-xl border border-command-border bg-white text-slate-800 px-3 py-2.5 text-sm"
            >
              {KITCHEN_CENTER_OPTIONS.map(area => (
                <option key={area.id} value={area.id}>{area.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Los productos de esta categoría aparecerán en esa pantalla de cocina.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCategoryColor(color)}
                  className={cn(
                    'w-9 h-9 rounded-xl border-2 transition-all',
                    categoryColor === color ? 'border-slate-800 scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowCategoryModal(false)}>Cancelar</Button>
            <Button className="flex-1" loading={savingCategory} onClick={handleCreateCategory} disabled={!categoryName.trim()}>
              {editCategory ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
