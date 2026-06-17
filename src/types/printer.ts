export type PrinterBrand =
  | 'epson'
  | 'star'
  | 'bixolon'
  | 'citizen'
  | 'xprinter'
  | 'generic_escpos'

export type PrinterConnection = 'bluetooth' | 'wifi'
export type PrinterRole = 'caja' | 'cocina' | 'barra' | 'otro'
export type PaperWidth = 58 | 80

export interface PrinterDevice {
  id: string
  name: string
  brand: PrinterBrand
  connection: PrinterConnection
  role: PrinterRole
  /** IP para WiFi (ej. 192.168.1.50) */
  host?: string
  /** Puerto raw ESC/POS (default 9100) o HTTP según marca */
  port?: number
  paperWidth: PaperWidth
  isDefault?: boolean
  /** ID Bluetooth guardado tras primer emparejamiento */
  bluetoothId?: string
  sucursal_id?: string
}

export interface TicketPrintJob {
  lines: string[]
  title?: string
  cut?: boolean
}

export interface PrintResult {
  ok: boolean
  method: 'bluetooth' | 'wifi' | 'browser'
  message?: string
}
