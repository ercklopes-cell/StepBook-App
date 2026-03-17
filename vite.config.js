import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // App React servido em /app/ — raiz / fica livre para a landing
  base: '/app/',
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  }
})
