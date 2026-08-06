# UnieMax — Project Instructions

White-label e-commerce platform. Backend: Fastify + Prisma 7 + PostgreSQL (Supabase).
Frontend: React + Tailwind.

## Documentation Maintenance (IMPORTANT)

**Every code change must keep the docs in sync.** After making a change, update the
respective `.md` file in the same task — do not leave it for later. One fact lives in
one file (no duplication).

| If you change…                                   | Update this doc                     |
| ------------------------------------------------ | ----------------------------------- |
| An API endpoint (add/remove/params/response)     | [`docs/API.md`](./docs/API.md)      |
| Architecture, module pattern, conventions, stack | [`docs/BACKEND_CONTEXT.md`](./docs/BACKEND_CONTEXT.md) |
| Backend setup, scripts, or env vars              | [`backend/README.md`](./backend/README.md) |
| Product scope / features / requirements          | [`docs/CONTEXT.md`](./docs/CONTEXT.md) |
| High-level project overview or features list     | [`README.md`](./README.md)          |
| Prisma schema models/enums                       | [`docs/BACKEND_CONTEXT.md`](./docs/BACKEND_CONTEXT.md) (Data Model section) |

Rules:
- If a change spans several concerns, update **each** relevant doc.
- Never add new `.md` files for things the set above already covers.
- Keep doc edits minimal and factual — reflect what the code does now, nothing aspirational.
- When a planned feature lands, move it out of the "planned"/"not yet" notes in `API.md`
  and `BACKEND_CONTEXT.md`.

## Backend Conventions (summary — full detail in BACKEND_CONTEXT.md)

- **Module pattern:** each feature = `schema.ts` · `service.ts` · `controller.ts` ·
  `routes.ts` under `src/modules/<name>/`, registered in `src/routes.ts`.
- **Validation:** parse request input with Zod inside controllers; services never see
  unvalidated data.
- **Errors:** throw `HttpError.*` from services; the central handler maps Zod/Prisma/
  HttpError to the standard JSON envelope.
- **Responses:** always `ok()` / `list()` from `utils/response.ts`.
- **Public vs admin:** public queries force active-only; `/api/v1/admin/**` is a
  separate subtree guarded by `requireAdmin`.
- **Auth:** Bearer JWT with two token kinds (admin = email/password; customer = OTP to
  **email or phone**, each unique to one account, with post-login linking of the second
  identifier). Guards in `middleware/auth.ts` (`requireAdmin` / `requireCustomer`);
  wrong-kind token → 403, missing/invalid → 401. New protected routes must use the right
  guard.
- After editing `prisma/schema.prisma`: run `npm run db:migrate` (creates + applies a
  migration locally) and **commit `prisma/migrations/`** — that committed folder is how
  the change reaches production, which runs `npm run db:deploy`. Never `prisma db push`:
  it mutates the local DB without producing a migration, so production never learns of it.
