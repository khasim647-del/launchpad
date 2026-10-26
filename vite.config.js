import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative paths so the built site works on any host,
  // including sub-folders like https://username.github.io/mystart/
  base: './',
  // Unit tests (npm test): run in a fake browser page.
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // Tests always run with sign-in turned on, whatever is in .env.local.
    env: { VITE_API_URL: 'http://api.test', VITE_GOOGLE_CLIENT_ID: 'test-client-id' },
  },
})
