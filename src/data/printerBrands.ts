import type { PrinterBrand, PaperWidth } from '@/types/printer'

export interface PrinterBrandPreset {
  id: PrinterBrand
  label: string
  models: string[]
  connection: ('bluetooth' | 'wifi')[]
  defaultPort: number
  notes: string
}

export const PRINTER_BRANDS: PrinterBrandPreset[] = [
  {
    id: 'epson',
    label: 'Epson',
    models: ['TM-T20', 'TM-T20III', 'TM-m30', 'TM-U220', 'TM-T88'],
    connection: ['wifi', 'bluetooth'],
    defaultPort: 8008,
    notes: 'WiFi: ePOS-Print (puerto 8008/80). BT: ESC/POS vía Web Bluetooth.',
  },
  {
    id: 'star',
    label: 'Star Micronics',
    models: ['TSP143III', 'TSP654II', 'mC-Print3', 'SM-S230i'],
    connection: ['wifi', 'bluetooth'],
    defaultPort: 8001,
    notes: 'WiFi: Star webPRNT. BT: Star portable series.',
  },
  {
    id: 'bixolon',
    label: 'Bixolon',
    models: ['SRP-350III', 'SRP-275III', 'SPP-R200III', 'SRP-E300'],
    connection: ['wifi', 'bluetooth'],
    defaultPort: 9100,
    notes: 'WiFi: raw 9100 en red local. BT: ESC/POS.',
  },
  {
    id: 'citizen',
    label: 'Citizen',
    models: ['CT-S310II', 'CT-E351', 'CT-S651'],
    connection: ['wifi', 'bluetooth'],
    defaultPort: 9100,
    notes: 'ESC/POS estándar por WiFi o Bluetooth.',
  },
  {
    id: 'xprinter',
    label: 'Xprinter',
    models: ['XP-N160II', 'XP-P300', 'XP-58IIH', 'XP-80'],
    connection: ['wifi', 'bluetooth'],
    defaultPort: 9100,
    notes: 'Muy usada en México — ESC/POS genérico.',
  },
  {
    id: 'generic_escpos',
    label: 'ESC/POS genérica',
    models: ['58mm / 80mm cualquier marca'],
    connection: ['wifi', 'bluetooth'],
    defaultPort: 9100,
    notes: 'Impresoras térmicas compatibles ESC/POS sin SDK propietario.',
  },
]

export function brandPreset(brand: PrinterBrand): PrinterBrandPreset {
  return PRINTER_BRANDS.find((b) => b.id === brand) || PRINTER_BRANDS[PRINTER_BRANDS.length - 1]
}

export function charsPerLine(width: PaperWidth): number {
  return width === 58 ? 32 : 48
}
