const CHANNEL_NAME = 'ia-restaurant-ops'
let channel: BroadcastChannel | null = null

function getChannel() {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME)
  return channel
}

export const opsBroadcast = {
  notify() {
    getChannel()?.postMessage({ type: 'ops-sync', ts: Date.now() })
  },
  subscribe(handler: () => void) {
    const ch = getChannel()
    if (!ch) return () => {}
    const listener = () => handler()
    ch.addEventListener('message', listener)
    return () => ch.removeEventListener('message', listener)
  },
}
