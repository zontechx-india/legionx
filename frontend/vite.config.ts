import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Connect, Plugin } from 'vite'

/**
 * Dev-only admin router — mirrors what nginx does in production.
 *
 * The admin console is a SEPARATE build (`admin.html`) served on the same
 * origin under the `/admin` path, so its bundle never ships to a customer.
 * Because it is a client-side router, every deep link (`/admin/orders/x`)
 * must also return `admin.html`, exactly like nginx's
 * `location /admin { try_files $uri /admin.html; }`.
 *
 *   Storefront →  http://localhost:5173
 *   Admin      →  http://localhost:5173/admin
 *
 * The legacy `admin.` sub-domain form still resolves, so an existing
 * bookmark keeps working (`*.localhost` points at 127.0.0.1 automatically).
 */
function adminRouter(): Plugin {
  const handler: Connect.NextHandleFunction = (req, _res, next) => {
    const host = (req.headers.host ?? '').split(':')[0]
    const path = (req.url ?? '/').split('?')[0]
    const isHtmlNav = (req.headers.accept ?? '').includes('text/html')
    const isAdmin =
      host.startsWith('admin.') || path === '/admin' || path.startsWith('/admin/')

    // Only rewrite top-level navigations; let assets (JS/CSS/img) pass through.
    if (isAdmin && isHtmlNav) {
      req.url = '/admin.html'
    }
    next()
  }

  return {
    name: 'admin-router',
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
  plugins: [react(), tailwindcss(), adminRouter()],
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
