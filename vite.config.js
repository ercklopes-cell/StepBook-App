import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    {
      // Após o build, sobrescreve dist/index.html (do React) com a landing page
      // O app React continua acessível em /app via rewrite do vercel.json
      name: 'landing-as-root',
      closeBundle() {
        try {
          copyFileSync(
            resolve(__dirname, 'public/landing.html'),
            resolve(__dirname, 'dist/index.html')
          )
          console.log('✅ landing.html → dist/index.html')
        } catch (e) {
          console.error('Erro ao copiar landing.html:', e)
        }
      }
    }
  ],
  optimizeDeps: {
    include: ['pdfjs-dist']
  }
})
