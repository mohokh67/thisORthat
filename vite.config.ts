/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Hosted at https://<user>.github.io/thisORthat/ (project-path GitHub Pages).
// Revisit `base` if a custom domain is attached later.
export default defineConfig({
  base: '/thisORthat/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
