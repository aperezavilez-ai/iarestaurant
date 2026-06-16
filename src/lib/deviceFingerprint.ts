const DEVICE_ID_KEY = 'ia-restaurant-device-id'

export function getStoredDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

function detectDeviceLabel(): string {
  const ua = navigator.userAgent
  if (/iPhone|iPad/i.test(ua)) return 'iOS'
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac/i.test(ua)) return 'Mac'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Navegador'
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface DeviceFingerprint {
  deviceId: string
  hash: string
  label: string
}

export async function getDeviceFingerprint(): Promise<DeviceFingerprint> {
  const deviceId = getStoredDeviceId()
  const raw = [
    deviceId,
    navigator.userAgent,
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join('|')
  const hash = await sha256(raw)
  const browser = /Chrome/i.test(navigator.userAgent) ? 'Chrome'
    : /Safari/i.test(navigator.userAgent) ? 'Safari'
    : /Firefox/i.test(navigator.userAgent) ? 'Firefox'
    : 'Web'
  return {
    deviceId,
    hash,
    label: `${browser} · ${detectDeviceLabel()}`,
  }
}
