import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Si subes a un subdirectorio cambia '/' por '/celiapp/'
  base: '/',

  build: {
    // Umbral de advertencia de chunk en KB
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Separa react, axios y html5-qrcode en chunks propios (mejor caching)
        manualChunks: {
          vendor: ['react', 'react-dom'],
          http:   ['axios'],
          scanner: ['html5-qrcode'],
        },
      },
    },
  },

  server: {
    port: 5173,
    // Proxy para evitar CORS en desarrollo
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})