/// <reference types="vitest/config" />
import { copyFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// The app uses the History API for routing, so deep links like `/b/<id>` hit
// GitHub Pages as real paths with no matching file. Pages serves `404.html` for
// those; making it a copy of `index.html` boots the SPA, which then reads
// `location.pathname` and renders the right route.
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html')
    },
  }
}

// Served at the root of a custom domain (https://thisorthat.koolstuff.app) via
// GitHub Pages. `public/CNAME` carries the domain into the deploy artifact.
export default defineConfig({
  base: '/',
  plugins: [react(), spaFallback()],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
