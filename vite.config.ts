import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

/**
 * PWA solo en modo self-destroying: el SW anterior de Workbox cacheaba
 * bundles viejos y rompía el login en producción. No volvemos a precachear.
 */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      selfDestroying: true,
      injectRegister: false,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: false,
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
