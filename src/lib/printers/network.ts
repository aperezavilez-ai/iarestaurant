import type { PrinterBrand, PrinterDevice } from '@/types/printer'

function epsonXml(body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>${body}</s:Body>
</s:Envelope>`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Epson ePOS-Print HTTP (TM series en red local) */
async function printEpson(host: string, port: number, text: string): Promise<void> {
  const lines = text.split('\n').map((l) => `<text>${esc(l)}&#10;</text>`).join('')
  const xml = epsonXml(`<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">${lines}<cut/></epos-print>`)
  const url = `http://${host}:${port}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=60000`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body: xml,
  })

  if (!res.ok) throw new Error(`Epson respondió HTTP ${res.status}`)
  const body = await res.text()
  if (body.includes('success="false"') || body.includes('code="')) {
    if (!body.includes('success="true"')) {
      throw new Error('Epson rechazó la impresión — verifica IP y que ePOS esté activo')
    }
  }
}

/** Star webPRNT */
async function printStar(host: string, port: number, text: string): Promise<void> {
  const markup = `<root><text align="center">IA·RESTAURANT</text><text>${esc(text)}</text><cut/></root>`
  const url = `http://${host}:${port}/StarWebPRNT/SendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body: markup,
  })
  if (!res.ok) throw new Error(`Star respondió HTTP ${res.status}`)
}

/**
 * WiFi en red local — el navegador debe estar en la misma red que la impresora.
 * No funciona desde Vercel/cloud; solo desde el dispositivo del restaurante.
 */
export async function printViaWifi(
  device: PrinterDevice,
  text: string,
  rawBytes?: Uint8Array,
): Promise<void> {
  const host = device.host?.trim()
  if (!host) throw new Error('Configura la IP de la impresora')

  const port = device.port || defaultPort(device.brand)

  switch (device.brand) {
    case 'epson':
      await printEpson(host, port === 9100 ? 8008 : port, text)
      return
    case 'star':
      await printStar(host, port === 9100 ? 8001 : port, text)
      return
    case 'bixolon':
    case 'citizen':
    case 'xprinter':
    case 'generic_escpos':
      await printRawHttp(host, port, rawBytes || new TextEncoder().encode(text))
      return
    default:
      await printRawHttp(host, port, rawBytes || new TextEncoder().encode(text))
  }
}

function defaultPort(brand: PrinterBrand): number {
  if (brand === 'epson') return 8008
  if (brand === 'star') return 8001
  return 9100
}

/** Intenta envío raw por HTTP a puerto 9100 (algunas impresoras en LAN) */
async function printRawHttp(host: string, port: number, data: Uint8Array): Promise<void> {
  const url = `http://${host}:${port}`
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      body: data as BodyInit,
    })
    // no-cors no devuelve status — asumimos envío si no hay excepción de red
    return
  } catch {
    throw new Error(
      `No se alcanzó ${host}:${port}. Verifica que el dispositivo esté en la misma red WiFi que la impresora. ` +
        'Para Epson usa marca Epson; para Star usa Star Micronics.',
    )
  }
}

export function wifiPrintHint(brand: PrinterBrand): string {
  const hints: Record<PrinterBrand, string> = {
    epson: 'IP fija en la impresora · ePOS activo · puerto 8008',
    star: 'IP fija · Star webPRNT habilitado · puerto 8001',
    bixolon: 'IP fija · puerto raw 9100 · misma red WiFi',
    citizen: 'IP fija · puerto 9100',
    xprinter: 'IP fija · puerto 9100 · ESC/POS',
    generic_escpos: 'IP fija · puerto 9100',
  }
  return hints[brand]
}
