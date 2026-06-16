const SHIFT_CHANGED = 'ia-restaurant-shift-changed'

export function notifyShiftChanged() {
  window.dispatchEvent(new Event(SHIFT_CHANGED))
}

export function onShiftChanged(handler: () => void) {
  window.addEventListener(SHIFT_CHANGED, handler)
  return () => window.removeEventListener(SHIFT_CHANGED, handler)
}
