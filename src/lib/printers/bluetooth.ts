/** Web Bluetooth — impresoras ESC/POS con perfil serial (SPP over GATT) */

const SERIAL_SERVICE = '49535343-fe7d-4ae8-9fa6-26fed844a26d'
const SERIAL_WRITE = '49535343-8841-43f4-a8d0-6c722df50c26'

interface BtDevice {
  id: string
  name?: string
  gatt?: { connect: () => Promise<BtGattServer>; disconnect: () => void }
}

interface BtGattServer {
  getPrimaryService: (uuid: string) => Promise<{ getCharacteristic: (uuid: string) => Promise<{ writeValue: (v: BufferSource) => Promise<void> }> }>
  disconnect: () => void
}

export function isBluetoothPrintSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
}

export async function printViaBluetooth(data: Uint8Array, deviceId?: string): Promise<void> {
  if (!isBluetoothPrintSupported()) {
    throw new Error('Este navegador no soporta Bluetooth. Usa Chrome en Android o Windows.')
  }

  const nav = navigator as Navigator & {
    bluetooth: {
      requestDevice: (opts: unknown) => Promise<BtDevice>
      getDevices?: () => Promise<BtDevice[]>
    }
  }

  let device: BtDevice | undefined

  if (deviceId && nav.bluetooth.getDevices) {
    const known = await nav.bluetooth.getDevices()
    device = known.find((d) => d.id === deviceId)
  }

  if (!device) {
    device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERIAL_SERVICE, '000018f0-0000-1000-8000-00805f9b34fb'],
    })
  }

  const server = await device.gatt?.connect()
  if (!server) throw new Error('No se pudo conectar por Bluetooth')

  try {
    const service = await server.getPrimaryService(SERIAL_SERVICE)
    const characteristic = await service.getCharacteristic(SERIAL_WRITE)

    const chunkSize = 512
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      await characteristic.writeValue(chunk)
    }
  } finally {
    server.disconnect()
  }

  return
}

export async function getBluetoothDeviceName(deviceId?: string): Promise<string | undefined> {
  if (!deviceId || !isBluetoothPrintSupported()) return undefined
  const nav = navigator as Navigator & { bluetooth: { getDevices?: () => Promise<BtDevice[]> } }
  if (!nav.bluetooth.getDevices) return undefined
  const known = await nav.bluetooth.getDevices()
  return known.find((d) => d.id === deviceId)?.name
}
