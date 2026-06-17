import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Printer, Plus, Trash2, Bluetooth, Wifi, TestTube2, Check, AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { printerService } from '@/services/printerService'
import { PRINTER_BRANDS, brandPreset } from '@/data/printerBrands'
import { wifiPrintHint } from '@/lib/printers/network'
import { cn } from '@/lib/utils'
import type { PrinterBrand, PrinterConnection, PrinterDevice, PrinterRole, PaperWidth } from '@/types/printer'

const ROLES: { id: PrinterRole; label: string }[] = [
  { id: 'caja', label: 'Caja / tickets' },
  { id: 'cocina', label: 'Cocina' },
  { id: 'barra', label: 'Barra' },
  { id: 'otro', label: 'Otro' },
]

const emptyForm = (): Omit<PrinterDevice, 'id'> => ({
  name: '',
  brand: 'epson',
  connection: 'wifi',
  role: 'caja',
  host: '',
  port: 8008,
  paperWidth: 80,
  isDefault: true,
})

export default function PrintingPage() {
  const sucursalId = useAuthStore((s) => s.sucursal?.id)
  const [devices, setDevices] = useState<PrinterDevice[]>([])
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const reload = () => setDevices(printerService.list(sucursalId))

  useEffect(() => { reload() }, [sucursalId])

  const onBrandChange = (brand: PrinterBrand) => {
    const preset = brandPreset(brand)
    setForm((f) => ({
      ...f,
      brand,
      port: preset.defaultPort,
      connection: f.connection === 'bluetooth' && !preset.connection.includes('bluetooth')
        ? 'wifi'
        : f.connection,
    }))
  }

  const saveDevice = () => {
    if (!form.name.trim()) {
      toast('Indica un nombre para la impresora', 'error')
      return
    }
    if (form.connection === 'wifi' && !form.host?.trim()) {
      toast('Indica la IP de la impresora en WiFi', 'error')
      return
    }

    const device: PrinterDevice = {
      ...form,
      id: editingId || crypto.randomUUID(),
      name: form.name.trim(),
      host: form.host?.trim(),
      sucursal_id: sucursalId,
    }
    printerService.save(device)
    reload()
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
    toast('Impresora guardada', 'success')
  }

  const editDevice = (d: PrinterDevice) => {
    setEditingId(d.id)
    setForm({
      name: d.name,
      brand: d.brand,
      connection: d.connection,
      role: d.role,
      host: d.host || '',
      port: d.port,
      paperWidth: d.paperWidth,
      isDefault: d.isDefault,
      bluetoothId: d.bluetoothId,
      sucursal_id: d.sucursal_id,
    })
    setShowForm(true)
  }

  const removeDevice = (id: string) => {
    printerService.remove(id)
    reload()
    toast('Impresora eliminada', 'success')
  }

  const testPrint = async (device: PrinterDevice) => {
    setTestingId(device.id)
    try {
      const result = await printerService.printTest(device)
      toast(result.message || `Impreso por ${result.method}`, result.method === 'browser' ? 'error' : 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al imprimir', 'error')
    } finally {
      setTestingId(null)
    }
  }

  const pairBluetooth = async () => {
    if (!printerService.isBluetoothSupported()) {
      toast('Usa Chrome en Windows o Android para Bluetooth', 'error')
      return
    }
    try {
      const nav = navigator as Navigator & { bluetooth: { requestDevice: (o: unknown) => Promise<{ id: string; name?: string }> } }
      const bt = await nav.bluetooth.requestDevice({ acceptAllDevices: true })
      setForm((f) => ({
        ...f,
        connection: 'bluetooth',
        name: f.name || bt.name || 'Impresora Bluetooth',
        bluetoothId: bt.id,
      }))
      toast(`Emparejado: ${bt.name || bt.id}`, 'success')
    } catch (e) {
      if (e instanceof Error && !e.message.includes('cancelled')) {
        toast(e.message, 'error')
      }
    }
  }

  const preset = brandPreset(form.brand)

  return (
    <div className="max-w-4xl space-y-6 animate-fadeUp">
      <div>
        <p className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">Operación</p>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Printer size={24} /> Impresoras de ticket
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Conecta impresoras térmicas por <strong>Bluetooth</strong> o <strong>WiFi</strong> (misma red del local).
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 leading-relaxed">
        <p className="font-bold flex items-center gap-1.5"><AlertCircle size={14} /> Importante</p>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>WiFi solo funciona si el navegador está en la <strong>misma red</strong> que la impresora (no desde internet externo).</li>
          <li>Bluetooth: Chrome en Android o Windows, con la impresora encendida y emparejable.</li>
          <li>Marcas soportadas: Epson, Star, Bixolon, Citizen, Xprinter y ESC/POS genérica.</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PRINTER_BRANDS.map((b) => (
          <div key={b.id} className="rounded-xl border border-command-border bg-white p-3 text-center">
            <p className="font-bold text-sm text-slate-800">{b.label}</p>
            <p className="text-[10px] text-slate-500 mt-1">{b.models.slice(0, 2).join(', ')}…</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center gap-3 flex-wrap">
        <p className="font-bold text-slate-800">Mis impresoras ({devices.length})</p>
        <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()) }}>
          <Plus size={14} /> Agregar impresora
        </Button>
      </div>

      {devices.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Sin impresoras configuradas. Agrega una para imprimir tickets desde POS y caja sin depender solo del navegador.
        </Card>
      ) : (
        <div className="grid gap-3">
          {devices.map((d) => (
            <Card key={d.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-800">{d.name}</p>
                  {d.isDefault && <Badge variant="amber">Predeterminada</Badge>}
                  <Badge variant="info">{ROLES.find((r) => r.id === d.role)?.label}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {brandPreset(d.brand).label} · {d.connection === 'wifi' ? `WiFi ${d.host}:${d.port}` : 'Bluetooth'}
                  {' · '}{d.paperWidth}mm
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" loading={testingId === d.id} onClick={() => testPrint(d)}>
                  <TestTube2 size={14} /> Prueba
                </Button>
                <Button size="sm" variant="outline" onClick={() => editDevice(d)}>Editar</Button>
                <Button size="sm" variant="outline" onClick={() => removeDevice(d.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Card className="p-5 space-y-4 border-2 border-brand-200">
          <p className="font-bold text-slate-800">{editingId ? 'Editar impresora' : 'Nueva impresora'}</p>

          <Input label="Nombre" placeholder="Caja principal" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Marca</label>
              <select
                className="mt-1 w-full border border-command-border rounded-xl px-3 py-2 text-sm"
                value={form.brand}
                onChange={(e) => onBrandChange(e.target.value as PrinterBrand)}
              >
                {PRINTER_BRANDS.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Uso</label>
              <select
                className="mt-1 w-full border border-command-border rounded-xl px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as PrinterRole }))}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            {(['wifi', 'bluetooth'] as PrinterConnection[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, connection: c, port: brandPreset(f.brand).defaultPort }))}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm',
                  form.connection === c ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-command-border text-slate-500'
                )}
              >
                {c === 'wifi' ? <Wifi size={16} /> : <Bluetooth size={16} />}
                {c === 'wifi' ? 'WiFi / Red' : 'Bluetooth'}
              </button>
            ))}
          </div>

          {form.connection === 'wifi' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="IP de la impresora"
                placeholder="192.168.1.50"
                value={form.host || ''}
                onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
                className="sm:col-span-2"
              />
              <Input
                label="Puerto"
                type="number"
                value={String(form.port || preset.defaultPort)}
                onChange={(e) => setForm((f) => ({ ...f, port: Number(e.target.value) }))}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Button type="button" variant="outline" onClick={pairBluetooth}>
                <Bluetooth size={14} /> Buscar impresora Bluetooth
              </Button>
              {form.bluetoothId && (
                <p className="text-xs text-ops-success flex items-center gap-1">
                  <Check size={12} /> Emparejada — {form.name}
                </p>
              )}
            </div>
          )}

          <p className="text-[10px] text-slate-500">{preset.notes} · {wifiPrintHint(form.brand)}</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Ancho papel</label>
              <select
                className="mt-1 w-full border border-command-border rounded-xl px-3 py-2 text-sm"
                value={form.paperWidth}
                onChange={(e) => setForm((f) => ({ ...f, paperWidth: Number(e.target.value) as PaperWidth }))}
              >
                <option value={58}>58 mm</option>
                <option value={80}>80 mm</option>
              </select>
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              />
              Predeterminada para {ROLES.find((r) => r.id === form.role)?.label}
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveDevice}>Guardar</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <p className="text-sm font-bold text-slate-800 mb-2">También disponible</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/cash"><Button size="sm" variant="outline">QR mesas · Caja</Button></Link>
          <Link to="/app/pos"><Button size="sm" variant="outline">POS tickets</Button></Link>
          <Link to="/app/cash/shift"><Button size="sm" variant="outline">Corte X / Z</Button></Link>
        </div>
      </Card>
    </div>
  )
}
