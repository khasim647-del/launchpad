import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative paths so the built site works on any host,
  // including sub-folders like https://username.github.io/mystart/
  base: './',
})
