# Frontend Context — White-Label E-Commerce Platform

> Engineering reference for the frontend. Read alongside [CONTEXT.md](./CONTEXT.md)
> (product spec), [BACKEND_CONTEXT.md](./BACKEND_CONTEXT.md), and [API.md](./API.md).

---

## Core Principle — Two Apps, One Repo

The frontend ships **two completely separate applications** deployed to two
origins:

| App        | Origin                    | Audience            | API surface           |
| ---------- | ------------------------- | ------------------- | --------------------- |
| Storefront | `shop.example.com`        | Customers (public)  | `/api/v1/...`         |
| Admin      | `admin.shop.example.com`  | Store operators     | `/api/v1/admin/...`   |

This mirrors the backend, which already splits its routes into a public
(customer) subtree and an `/admin` subtree (see [BACKEND_CONTEXT.md](./BACKEND_CONTEXT.md)).

**Why separate:**

- **Security** — admin code, routes, and views never ship in the bundle a
  customer downloads. The two are separate builds.
- **Isolation** — a change to the admin console cannot break the storefront and
  vice versa.
- **Deployment** — each origin can be cached, scaled, and access-controlled
  independently (e.g. admin behind IP allow-list / WAF).

---

## Current Status — Login Screens

The separation infrastructure is fully wired, and each app now renders a
**login page** with a **Facebook-style split-screen layout** (light theme,
minimal, professional):

- **Laptop / desktop (lg ≥ 1024px)** — two columns: a full-height marketing
  **hero** on the left (gradient background, brand logo, decorative product /
  dashboard mock, headline) and the **login panel** on the right.
- **Tablet / mobile (< lg)** — the hero is hidden and the login panel is
  centered full-width. The layout is mobile-first and overflow-safe
  (`w-full` + `max-w-sm` inside padded, centered columns).

The shared layout lives in `src/shared/ui/form.tsx` (`AuthLayout` + `Hero`);
each app supplies its own hero. The two flows differ to match the backend auth
model (see [BACKEND_CONTEXT.md](./BACKEND_CONTEXT.md)):

- **Storefront (customer)** → passwordless **OTP** to email *or* phone.
  Two steps: enter identifier → enter the 6-digit code.
- **Admin** → **email + password**.

**API integration is deferred.** Each page's submit handler carries a
`// TODO(api)` marker at the exact spot the backend call goes:

| Page             | Endpoint (to wire later)                    |
| ---------------- | ------------------------------------------- |
| Customer request | `POST /api/v1/auth/otp/request`             |
| Customer verify  | `POST /api/v1/auth/otp/verify`              |
| Admin sign in    | `POST /api/v1/admin/auth/login`             |

There is no routing yet — each entry mounts its `LoginPage` directly. Routing,
post-login pages, and data fetching come next.

---

## Tech Stack

| Concern       | Choice                                        |
| ------------- | --------------------------------------------- |
| Build tool    | Vite 8 (multi-page: two HTML entries)         |
| Framework     | React 19                                      |
| Language      | TypeScript (strict, bundler resolution)       |
| Styling       | Tailwind CSS v4 (`@tailwindcss/vite`)         |

> `react-router-dom` and `axios` are installed and ready but not yet used —
> they come back in when routing and data fetching are added.

---

## Directory Layout

```
frontend/
├── index.html               # Storefront entry → src/storefront/main.tsx
├── admin.html               # Admin entry      → src/admin/main.tsx
├── vite.config.ts           # Multi-page build + dev subdomain router
├── .env.example             # VITE_API_URL
└── src/
    ├── index.css            # Tailwind entry + base styles
    ├── shared/
    │   └── ui/form.tsx      # Auth primitives: AuthLayout (split screen), Hero,
    │                        #   AuthCard, Brand, TextField, PrimaryButton
    ├── storefront/
    │   ├── main.tsx         # Mounts the customer LoginPage
    │   └── pages/LoginPage.tsx   # OTP login (email or phone)
    └── admin/
        ├── main.tsx         # Mounts the admin LoginPage
        └── pages/LoginPage.tsx   # Email + password login
```

Keep app-specific code under `storefront/` or `admin/`, and put anything both
apps must share under `src/shared/`. **`storefront/` must never import from
`admin/`** (or vice versa) — that would defeat the bundle separation.

---

## How the Two Apps Are Kept Separate

### 1. Build time — separate bundles (`vite.config.ts`)

```ts
build: {
  rollupOptions: {
    input: {
      storefront: resolve(__dirname, 'index.html'),
      admin:      resolve(__dirname, 'admin.html'),
    },
  },
}
```

`npm run build` emits two independent entry HTMLs and two separate JS bundles
(`dist/assets/storefront-*.js`, `dist/assets/admin-*.js`). Shared code is
factored into a common chunk; app-specific code stays in its own bundle.

### 2. Dev server — subdomain emulation

In production the two subdomains are two origins routed by the CDN / reverse
proxy. Locally, a small Vite middleware (`subdomainRouter` in `vite.config.ts`)
emulates this from one dev server by inspecting the `Host` header:

| URL                                | Serves            |
| ---------------------------------- | ----------------- |
| `http://localhost:5173`            | Storefront        |
| `http://shop.localhost:5173`       | Storefront        |
| `http://admin.localhost:5173`      | Admin             |
| `http://admin.localhost:5173/...`  | Admin (deep links)|

`*.localhost` resolves to `127.0.0.1` automatically in modern browsers — no
hosts-file edits needed for dev.

---

## Running Locally

```bash
cd frontend
cp .env.example .env          # point VITE_API_URL at the backend
npm install
npm run dev                   # single dev server, both apps
```

Then open:

- Storefront → <http://localhost:5173>  (customer OTP login)
- Admin      → <http://admin.localhost:5173>  (admin email/password login)

Other scripts: `npm run build` (typecheck + build both), `npm run preview`
(serve `dist/`, subdomain router also active), `npm run lint`.

---

## Next Steps

1. Wire the three auth endpoints at the `// TODO(api)` markers in the two
   `LoginPage.tsx` files; store the returned JWT and redirect on success.
2. Add `react-router-dom` routers per app (`StorefrontApp` / `AdminApp`) plus an
   admin auth guard.
3. Add per-surface axios instances under `src/shared/api/`
   (`storefrontApi` → `/api/v1`, `adminApi` → `/api/v1/admin`) and shared domain
   types under `src/shared/types/`.
4. Build the post-login pages per the spec — storefront (Home, Category,
   Product, Cart, Checkout, Order Success, Order History) and admin (Dashboard,
   Products, Categories, Orders, Inventory, Shipping).

---

## Production Deployment Notes

- Build once (`npm run build`) → deploy `dist/` behind a proxy/CDN.
- Route `admin.shop.example.com` → serve `admin.html` (SPA fallback to
  `admin.html`); everything else → `index.html` (SPA fallback to `index.html`).
- Lock the admin origin down separately (WAF / IP allow-list / auth at the edge)
  in addition to the backend's admin-auth preHandler.
- Set `VITE_API_URL` per environment at build time.
