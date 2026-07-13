# Backend Context — White-Label E-Commerce Platform

> Engineering reference for the backend. Read alongside [CONTEXT.md](./CONTEXT.md)
> (product spec) and [API.md](./API.md) (endpoint reference).

---

## Tech Stack

| Concern        | Choice                                             |
| -------------- | -------------------------------------------------- |
| Runtime        | Node.js (ESM, `"type": "module"`)                  |
| Language       | TypeScript (strict, `nodenext`, `verbatimModuleSyntax`) |
| HTTP framework | Fastify 5                                          |
| ORM            | Prisma 7 (driver adapter, **not** schema `url`)    |
| Database       | PostgreSQL (Supabase)                              |
| Validation     | Zod 4                                              |
| Dev runner     | `tsx watch`                                        |
| Logging        | Pino (built into Fastify)                          |

Planned (hooks already in place): Socket.IO (real-time), JWT auth, AWS S3
(images), SMS OTP provider, Razorpay/UPI payments.

---

## Directory Layout

```
backend/
├── prisma/
│   ├── schema.prisma          # Data model (12 models, source of truth)
│   └── check.sql              # Connectivity probe for `npm run db:check`
├── prisma.config.ts           # Prisma 7 config — migration datasource (DIRECT_URL)
├── src/
│   ├── server.ts              # Entrypoint: listen + graceful shutdown + Socket.IO slot
│   ├── app.ts                 # buildApp(): plugins, error handlers, routes (no port)
│   ├── routes.ts              # Central route registrar (public + /admin subtrees)
│   ├── config/
│   │   ├── env.ts             # Zod-validated, typed `env`
│   │   └── prisma.ts          # PrismaClient singleton (pg adapter, pooled URL)
│   ├── plugins/
│   │   └── prisma.ts          # Decorates app.prisma; connect/disconnect lifecycle
│   ├── middleware/
│   │   ├── errorHandler.ts    # Central error + 404 handler
│   │   └── auth.ts            # requireAdmin / requireCustomer route guards
│   ├── modules/               # Feature modules (one folder each)
│   │   ├── health/
│   │   ├── auth/              # Customer auth (phone OTP) + self-service (me, orders)
│   │   ├── adminAuth/         # Admin auth (login, me)
│   │   ├── category/          # schema · service · controller · routes
│   │   └── product/
│   │   └── (orders, shipping, inventory, payments, settings, dashboard — planned)
│   ├── providers/             # External integrations
│   │   ├── sms/               # SMS provider (console stub → Twilio/MSG91 later)
│   │   └── email/             # Email provider (console stub → SES/Resend later)
│   ├── scripts/
│   │   └── createAdmin.ts     # Bootstrap an admin (npm run create-admin)
│   ├── utils/                 # response, slug, httpError, zodHelpers, logger, jwt, password, otp
│   └── generated/prisma/      # Prisma client (generated, git-ignored)
└── .env                       # runtime, DB, JWT, OTP config (see Environment below)
```

---

## Application Lifecycle

1. `server.ts` calls `buildApp()`.
2. `buildApp()` (in `app.ts`):
   - creates Fastify (`trustProxy: true`, Pino logger),
   - registers `@fastify/cors`,
   - `registerPrisma(app)` → `prisma.$connect()` + `app.decorate("prisma", …)` + `onClose` disconnect,
   - sets the global error handler + not-found handler,
   - registers routes.
3. `server.ts` calls `app.listen()` and wires `SIGINT`/`SIGTERM` → `app.close()` (drains
   requests, disconnects Prisma).

**Socket.IO attaches later** at the marked slot in `server.ts` via `app.server` (the raw
HTTP server) — no separate port. `app.decorate("io", io)` will expose it to handlers.

---

## Module Pattern (how every feature is structured)

Each feature module is four files with a strict one-way dependency flow:

```
routes.ts  →  controller.ts  →  service.ts  →  prisma
   │              │                 │
 defines       parses request    DB logic + business rules
 endpoints     (zod), calls      (throws HttpError), returns
 (plugins)     service, wraps    plain data
               with ok()/list()
schema.ts  →  zod schemas + inferred TS types (shared by controller)
```

- **`*.schema.ts`** — Zod schemas for body/query/params + `z.infer` types.
- **`*.service.ts`** — all Prisma access and business rules. Imports the `prisma`
  singleton directly. Throws `HttpError` for expected failures. Returns plain objects.
- **`*.controller.ts`** — thin. Parses input with the zod schema (parse errors become
  422 via the error handler), calls the service, wraps the result in `ok()` / `list()`.
- **`*.routes.ts`** — exports `FastifyPluginAsync`(s). Public and admin surfaces are
  exported separately so auth can wrap admin routes.

To add a module: create the four files, then add one `register` line in `routes.ts`.
`modules/health/health.routes.ts` is the minimal template.

---

## Conventions

### Response envelope (`utils/response.ts`)
```jsonc
// success
{ "success": true, "data": { … } }
// list
{ "success": true, "data": [ … ], "meta": { "total", "page", "pageSize", "totalPages" } }
// error
{ "success": false, "statusCode": 409, "error": "Conflict", "message": "…", "issues"?: [ … ] }
```

### Errors (`utils/httpError.ts` + `middleware/errorHandler.ts`)
Throw `HttpError.notFound(msg)` / `.conflict()` / `.badRequest()` etc. from services.
The central handler maps:
| Thrown / caught                     | HTTP | Notes                                   |
| ----------------------------------- | ---- | --------------------------------------- |
| `ZodError`                          | 422  | includes field-level `issues[]`         |
| `HttpError`                         | its code | reason-phrase `error` label         |
| Prisma `P2002` (unique)             | 409  | e.g. duplicate SKU/slug                 |
| Prisma `P2025` (not found)          | 404  |                                         |
| Prisma `P2003` (FK)                 | 400  | bad `categoryId` etc.                   |
| anything else                       | 500  | details hidden in production            |

### Validation
Request data is parsed with Zod **inside controllers** (`schema.parse(request.body)`).
No unvalidated input reaches services. `utils/zodHelpers.ts` holds shared pieces:
`boolQuery` (safe `"true"/"false"` coercion), `paginationQuery`, `idParamSchema`,
`slugParamSchema`.

### Slugs
`utils/slug.ts` `slugify()` + a per-module `uniqueSlug()` that appends `-2`, `-3`… on
collision. Slugs are generated on create and kept stable across renames.

### Public vs Admin
Routes split into `/api/v1/...` (public/customer) and `/api/v1/admin/...`. Public
list/detail queries force `status = ACTIVE` / `isActive = true`; admin sees everything.

### Authentication (`utils/jwt.ts`, `middleware/auth.ts`)
Bearer JWT with **two token kinds** distinguished by a `type` claim (`"admin"` /
`"customer"`), both signed with `JWT_SECRET`; `sub` is the entity id.

- **Admin** — email + bcrypt password (`POST /admin/auth/login`). The `requireAdmin`
  guard wraps the whole `/admin` resource subtree in `routes.ts` (login is exempt);
  it sets `request.admin`. First admin is created with `npm run create-admin` (no
  public signup).
- **Customer** — OTP to **email or phone** (each request carries exactly one). A code is
  issued (hashed, TTL + attempt limits from env) and delivered via the channel's provider;
  `verify` finds-or-creates the `Customer`, marks that identifier verified, and returns a
  customer token. `requireCustomer` guards `/auth/me*` and sets `request.customer`.
  Guests browse/checkout freely — a token is only needed for own profile/orders.
- **Account linking** — a logged-in customer links the *other* identifier
  (`/auth/me/link/request` → `/auth/me/link/verify`), verified by a second OTP. Email and
  phone are each unique to one account (DB unique + a pre-check give a `409` on collision);
  identifiers can't be changed via the plain profile `PATCH`, only via verified linking.
- A token of the wrong kind on a guarded route → `403`; missing/invalid/expired → `401`.
- OTP delivery goes through `providers/sms` and `providers/email` (console stubs for now);
  in non-production the code is also returned as `devCode` for testing.

---

## Data Model (see `prisma/schema.prisma`)

White-label design — one codebase, any business:
- **StoreSetting** — single-row branding/contact/defaults.
- **Category** — self-relation (`parentId`) → arbitrary trees (Sports > Cricket Bat),
  `displayOrder`, `isActive`. Add categories without code changes.
- **Product** — price/discount as `Decimal(10,2)`, `stockQuantity`, JSON `specifications`
  (any product type, no schema change), `status`, `isFeatured`, unique `sku`/`slug`.
- **ProductImage** — multiple per product, one `isCover`, `displayOrder`.
- **Customer** — identified by `email` and/or `phone` (each nullable + unique, so an
  identifier maps to one account), with `emailVerifiedAt` / `phoneVerifiedAt`. Guest
  checkout; account not mandatory.
- **Order / OrderItem** — order snapshots delivery + money; items snapshot product
  name/sku/price so history survives product edits/deletes (`productId` nullable).
- **ShippingRule** — `FIXED` / `DISTRICT` / `STATE` / `FREE` with `priority`.
- **Otp** — hashed code with `channel` (SMS/EMAIL), `destination`, `purpose`
  (LOGIN / LINK / ORDER_PLACEMENT), optional `customerId` (for linking), expiry + attempts.
- **Banner** — home carousel.
- **Admin** — email + hashed password, roles (multi-admin ready).

Enums: `ProductStatus`, `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `ShippingType`,
`OtpChannel`, `OtpPurpose`, `AdminRole`.

---

## Database & Prisma 7 Notes

- **Two connection URLs** (Supabase):
  - `DATABASE_URL` — pooled (PgBouncer, `:6543`, `?pgbouncer=true`). Used by the app at
    runtime via the pg **driver adapter**.
  - `DIRECT_URL` — direct (`:5432`). Used by the Prisma CLI for migrations.
- In Prisma 7 the schema `datasource` has **no `url`** — connection config lives in
  `prisma.config.ts` (migrations) and in the `PrismaClient({ adapter })` constructor
  (runtime). The client is generated into `src/generated/prisma` so it typechecks under
  the strict `rootDir`.
- Schema changes are currently applied with **`prisma db push`** (no shadow DB needed on
  Supabase). Migration files will be adopted before production.

---

## NPM Scripts

| Script            | Purpose                                             |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | `tsx watch src/server.ts` (hot reload)              |
| `npm run build`   | `tsc` → `dist/`                                      |
| `npm start`       | `node dist/server.js`                               |
| `npm run typecheck` | `tsc --noEmit`                                    |
| `npm run db:check`  | Connectivity probe (`SELECT 1;` over `DIRECT_URL`) |
| `npm run create-admin -- <email> <pw> [name]` | Bootstrap/reset an admin account |
| `npx prisma generate` | Regenerate client after schema edits            |
| `npx prisma db push`  | Sync schema to the database                     |

Key env vars (see `config/env.ts` for the full validated schema): `DATABASE_URL`,
`DIRECT_URL`, `JWT_SECRET` (required), `JWT_ADMIN_EXPIRES_IN`, `JWT_CUSTOMER_EXPIRES_IN`,
`OTP_LENGTH`, `OTP_TTL_MINUTES`, `OTP_MAX_ATTEMPTS`, `CORS_ORIGIN`.

---

## Status & Roadmap

**Done:** base server, env/logging, Prisma wiring, error/response conventions, health
check, **Category** + **Product** APIs (public browse + admin CRUD), **Admin auth (JWT)**
guarding the `/admin` subtree, **Customer auth (phone OTP)** with self-service
profile/orders. All verified end-to-end.

**Not yet (hooks in place):**
1. **Orders + checkout** — create orders (guest/customer); history read already exists at
   `/auth/me/orders`. *Next.*
2. Shipping calculation, Inventory alerts, Banners, Store settings, Dashboard.
3. Providers: S3 image upload, real SMS gateway (OTP), payments (Razorpay/UPI).
4. Socket.IO real-time layer.
5. Formal Prisma migrations for production.
