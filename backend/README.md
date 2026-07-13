# LegionX Backend

Fastify + Prisma 7 + PostgreSQL (Supabase) API for the white-label e-commerce platform.

> **Docs:** architecture → [`docs/BACKEND_CONTEXT.md`](../docs/BACKEND_CONTEXT.md) ·
> endpoints → [`docs/API.md`](../docs/API.md) · product spec → [`docs/CONTEXT.md`](../docs/CONTEXT.md)

## Quick Start

```bash
npm install
cp .env .env            # ensure .env has DATABASE_URL + DIRECT_URL (Supabase)
npx prisma generate     # generate the Prisma client
npx prisma db push      # sync schema to the database
npm run create-admin -- admin@store.com "StrongPassword" "Store Owner"   # first admin
npm run dev             # start on http://localhost:4000 (hot reload)
```

Verify: `curl http://localhost:4000/health`

## Scripts

| Command             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Dev server with hot reload (`tsx watch`)         |
| `npm run build`     | Compile TypeScript to `dist/`                    |
| `npm start`         | Run the compiled build                           |
| `npm run typecheck` | Type-check without emitting                      |
| `npm run db:check`  | Probe the DB connection (`SELECT 1;`)            |
| `npm run create-admin -- <email> <pw> [name]` | Create/reset an admin account  |

## Environment (`.env`)

| Var            | Notes                                                     |
| -------------- | --------------------------------------------------------- |
| `NODE_ENV`     | `development` \| `test` \| `production`                   |
| `PORT`/`HOST`  | HTTP bind (default `4000` / `0.0.0.0`)                    |
| `LOG_LEVEL`    | Pino level (default `info`)                               |
| `CORS_ORIGIN`  | `*` or comma-separated allowlist                          |
| `DATABASE_URL` | Pooled connection (runtime) — Supabase PgBouncer `:6543`  |
| `DIRECT_URL`   | Direct connection (migrations) — Supabase `:5432`         |
| `JWT_SECRET`   | **Required.** Signs admin + customer tokens               |
| `JWT_ADMIN_EXPIRES_IN` / `JWT_CUSTOMER_EXPIRES_IN` | Token lifetimes (e.g. `1d`, `30d`) |
| `OTP_LENGTH` / `OTP_TTL_MINUTES` / `OTP_MAX_ATTEMPTS` | Customer OTP settings |

## Adding a feature module

Create four files under `src/modules/<name>/` (`schema` · `service` · `controller` ·
`routes`) and register the routes in `src/routes.ts`. See `modules/product/` for the
reference pattern, documented in [`docs/BACKEND_CONTEXT.md`](../docs/BACKEND_CONTEXT.md).
