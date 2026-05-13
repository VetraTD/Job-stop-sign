import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Allow NEXT_PUBLIC_* so keys copied from Next.js docs still work in this Vite app
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
