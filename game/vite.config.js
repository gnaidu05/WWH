import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: { port: 5173, host: true },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
  },
})
