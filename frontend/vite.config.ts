import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Connect, Plugin } from 'vite'

/**
 * Dev-only subdomain router.
 *
 * In production, `admin.shop.example.com` and `shop.example.com` are two
 * separate origins routed by nginx / CloudFront to the two built HTML entries.
 * In local dev we emulate that from a single Vite server: any HTML navigation
 * whose Host starts with `admin.` is rewritten to `/admin.html`; everything
 * else falls through to the storefront (`index.html`).
 *
 *   Storefront →  http://localhost:5173  or  http://shop.localhost:5173
 *   Admin      →  http://admin.localhost:5173
 *
 * (`*.localhost` resolves to 127.0.0.1 automatically in modern browsers.)
 */
function subdomainRouter(): Plugin {
  const handler: Connect.NextHandleFunction = (req, _res, next) => {
    const host = (req.headers.host ?? '').split(':')[0]
    const accept = req.headers.accept ?? ''
    const isAdminHost = host.startsWith('admin.')
    const isHtmlNav = accept.includes('text/html')

    // Only rewrite top-level navigations; let assets (JS/CSS/img) pass through.
    if (isAdminHost && isHtmlNav) {
      req.url = '/admin.html'
    }
    next()
  }

  return {
    name: 'subdomain-router',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), subdomainRouter()],
  server: {
    // Accept requests for *.localhost subdomains.
    host: true,
    // Same-origin API in dev: the SPA calls `/api/...` and Vite forwards to the
    // backend, so httpOnly auth cookies work without any CORS/SameSite setup —
    // matching production, where nginx serves the SPA and API from one domain.
    proxy: {
      '/api': 'http://localhost:4000',
      // Media served by the backend's local storage driver in dev (S3/CDN
      // absolute URLs bypass this entirely).
      '/uploads': 'http://localhost:4000',
    },
  },
  build: {
    rollupOptions: {
      input: {
        storefront: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
})
