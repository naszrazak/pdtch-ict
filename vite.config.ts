import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // SDK Firebase (auth, firestore, storage) membentuk sebahagian besar bundle utama.
  build: { chunkSizeWarningLimit: 1100 },
})
