import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

/** Elimina SW/caches residuales de builds PWA anteriores (rompe login si sirven JS viejo). */
async function purgeLegacyServiceWorkers() {
  if (!('serviceWorker' in navigator)) return
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  } catch {
    // Continuar aunque el navegador bloquee unregister.
  }
  if (!('caches' in window)) return
  try {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  } catch {
    // Continuar sin caché limpia.
  }
}

void purgeLegacyServiceWorkers()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
