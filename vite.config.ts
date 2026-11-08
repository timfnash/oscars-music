import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' lets the built site work from any path (GitHub Pages project URL or a custom domain).
export default defineConfig({ plugins: [react()], base: './' })
