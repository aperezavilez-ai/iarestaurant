import { buildEscPosTicket, buildTestTicket } from '@/lib/escpos/ticketEncoder'
import { printViaBluetooth, isBluetoothPrintSupported } from '@/lib/printers/bluetooth'
import { printViaWifi } from '@/lib/printers/network'
import type { PrinterDevice, PrintResult, TicketPrintJob } from '@/types/printer'

const STORAGE_KEY = 'ia-restaurant-printers'

function loadAll(): PrinterDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PrinterDevice[]) : []
  } catch {
    return []
  }
}

function saveAll(devices: PrinterDevice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(devices))
}

export const printerService = {
  isBluetoothSupported: isBluetoothPrintSupported,

  list(sucursalId?: string): PrinterDevice[] {
    const all = loadAll()
    if (!sucursalId) return all
    return all.filter((d) => !d.sucursal_id || d.sucursal_id === sucursalId)
  },

  save(device: PrinterDevice): PrinterDevice[] {
    const all = loadAll()
    const idx = all.findIndex((d) => d.id === device.id)
    const next = [...all]
    if (idx >= 0) next[idx] = device
    else next.push(device)
    if (device.isDefault) {
      for (const d of next) {
        if (d.id !== device.id && d.role === device.role) d.isDefault = false
      }
    }
    saveAll(next)
    return next
  },

  remove(id: string): PrinterDevice[] {
    const next = loadAll().filter((d) => d.id !== id)
    saveAll(next)
    return next
  },

  getDefault(role: PrinterDevice['role'], sucursalId?: string): PrinterDevice | undefined {
    const list = this.list(sucursalId).filter((d) => d.role === role)
    return list.find((d) => d.isDefault) || list[0]
  },

  async printTest(device: PrinterDevice): Promise<PrintResult> {
    const bytes = buildTestTicket(device.paperWidth)
    return this.printRaw(device, bytes, 'PRUEBA IA·RESTAURANT\nImpresora OK\n')
  },

  async printTicket(device: PrinterDevice, job: TicketPrintJob): Promise<PrintResult> {
    const bytes = buildEscPosTicket(job, device.paperWidth)
    const text = job.lines.join('\n')
    return this.printRaw(device, bytes, text)
  },

  async printRaw(device: PrinterDevice, bytes: Uint8Array, plainText: string): Promise<PrintResult> {
    try {
      if (device.connection === 'bluetooth') {
        await printViaBluetooth(bytes, device.bluetoothId)
        return { ok: true, method: 'bluetooth', message: 'Enviado por Bluetooth' }
      }
      if (device.connection === 'wifi') {
        await printViaWifi(device, plainText, bytes)
        return { ok: true, method: 'wifi', message: 'Enviado por WiFi (red local)' }
      }
      throw new Error('Conexión no soportada')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error de impresión'
      // Fallback navegador
      const fallback = window.open('', '_blank', 'width=320,height=600')
      if (fallback) {
        fallback.document.write(`<pre style="font-family:monospace;font-size:12px">${plainText}</pre>`)
        fallback.document.close()
        fallback.print()
        return { ok: true, method: 'browser', message: `${msg} — se abrió impresión del navegador` }
      }
      throw new Error(msg)
    }
  },

  async printToRole(
    role: PrinterDevice['role'],
    job: TicketPrintJob,
    sucursalId?: string,
  ): Promise<PrintResult | null> {
    const device = this.getDefault(role, sucursalId)
    if (!device) return null
    return this.printTicket(device, job)
  },
}
