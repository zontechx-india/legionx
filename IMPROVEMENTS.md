# UnieMax — Flow, UI & UX Improvement Backlog

> Full-system review of the customer flow (public storefront), owner flow
> (store management), UI and UX — what's missing, what's inconsistent, and
> what to build next. Reviewed: 24 Jul 2026 · last pruned 25 Jul 2026
> (completed items are removed from this list).
>
> Priorities: 🔴 critical · 🟡 UX improvement · 🟢 trust/SEO/a11y ·
> 🔵 performance & scale

---

## 🔴 Critical — the flow is broken at the end

- [ ] **1. Checkout + Orders (COD).** The cart is a dead end: a customer can
  browse → pick a variant → build a cart → and then nothing. Everything
  upstream is polished, but the shop cannot sell. Checkout (even COD-only,
  per the Phase-1 spec: guest OTP verification, per-store order splitting,
  shipping rules) is the single highest-value item left.
- [ ] **2. Product images (S3).** Every card is a grey box icon — the #1
  visual gap vs. the approved prototype, and no styling pass can compensate.
  Owner-side upload + image on card/product page changes the entire feel.
  *Blocked on AWS credentials/bucket.*

---

## 🟡 Storefront UX

- [ ] **3. Live search suggestions.** Products/categories dropdown while
  typing (the UX proposal lists it as optional); the header currently only
  submits on Enter.
- [ ] **4. Variant axes.** Variants are single labels ("Red / 128 GB");
  real stores eventually need axes (Color × Storage), or large matrices
  become unmanageable to enter and to pick from.
- [ ] **5. Product page is thin.** No specifications section — the admin's
  global `Product` has a `specifications` JSON column, but `StoreProduct`
  has only a description. Add the same JSON field + a specs table on the
  product page.
- [ ] **6. Empty-homepage risk.** With nothing merchandised the homepage is
  hero + categories only. Correct behaviour, but the owner isn't told —
  see item 8.

---

## 🟡 Owner / management UX

- [ ] **7. Onboarding checklist.** The enforced sequence (category →
  product → merchandise → publish) exists only as scattered gates. A
  "Get your store live" progress card (categories ✓, products ✓,
  homepage ✓, publish ✓) on the manage page would guide it.
- [ ] **8. Merchandising visibility in the Homepage editor.** The section
  list reorders rows but doesn't show *what's in them*; a per-row count
  ("Best Sellers — 0 products ⚠") would connect the Homepage and Products
  screens.
- [ ] **9. Dashboard landing is placeholder-ish.** With real stores it
  could show per-store stats (product counts, published state; later
  orders/revenue).
- [ ] **10. Confirm-per-checkbox fatigue.** Merchandising confirmations are
  right for safety, but flagging 20 products = 20 dialogs. Add a
  "don't ask again this session" option.
- [ ] **11. Category display order.** Owners can't reorder categories —
  nav and homepage cards follow creation order. Reuse the drag-and-drop
  pattern built for homepage sections (`StoreCategory` needs a
  `displayOrder`).
- [ ] **12. Admin app is still a placeholder.** The separate `admin.` origin
  has login + an empty dashboard; the global Category/Product admin UI was
  never built.

---

## 🟢 Trust, SEO & accessibility

- [ ] **13. Real meta/OG tags (SSR/prerender).** Per-route `document.title`
  shipped (25 Jul 2026, `shared/usePageTitle.ts`), but crawlers that don't
  run JS still see one static title and no OG tags — sharing previews and
  SEO need prerendering or SSR for the public storefront routes.
- [x] **14. Store trust surface is empty.** ~~Footer is only
  "Powered by UnieMax" — no about/contact/policies.~~ Resolved by Footer
  management (July 2026): owner-configured locations, contacts, social,
  policies, support and copyright now render in the storefront footer.

---

## 🔵 Performance & scale (fine today, will matter)

- [ ] **15. Search index.** Product search is `ILIKE contains` — add a
  `pg_trgm` index when catalogs grow.
- [ ] **16. Keyset pagination.** Offset pagination degrades deep into
  thousands of rows — move to cursor-based when needed.
- [ ] **17. HTTP caching.** The store shell/home endpoints were built to be
  cacheable — actually send `Cache-Control`/ETag (published-store responses
  only — never the owner draft preview).
- [ ] **18. Rate limiting.** The public API is unauthenticated and has no
  rate limits — add `@fastify/rate-limit`.
- [ ] **19. Owner products list loads everything.** Fine at 17 products,
  not at 1,000 — paginate the owner-side list too.

---

## Recommended order (top 4)

1. **Checkout + orders (COD)** — completes the loop everything else feeds
2. **Product images (S3)** — once credentials are available
3. **Merchandising visibility + empty-homepage nudge** (6 · 8)
4. **Onboarding checklist** (7)

> Checkout is the only one needing real design discussion up front:
> guest OTP flow, per-store order splitting, shipping-rule evaluation.
