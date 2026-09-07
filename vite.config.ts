/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served at the root of a custom domain (https://thisorthat.koolstuff.app) via
// GitHub Pages. `public/CNAME` carries the domain into the deploy artifact.
export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
