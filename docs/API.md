# API Reference — White-Label E-Commerce Platform

> Version 1 (`/api/v1`). See [BACKEND_CONTEXT.md](./BACKEND_CONTEXT.md) for
> architecture and conventions.

**Base URL (dev):** `http://localhost:4000`

## Conventions

- **Success:** `{ "success": true, "data": … }`
- **List:** `{ "success": true, "data": [ … ], "meta": { total, page, pageSize, totalPages } }`
- **Error:** `{ "success": false, "statusCode", "error", "message", "issues"? }`

| Status | When                                                        |
| ------ | ----------------------------------------------------------- |
| 200    | OK                                                          |
| 201    | Created                                                     |
| 400    | Bad request / bad foreign key                               |
| 404    | Not found                                                   |
| 409    | Conflict (duplicate `sku`/`slug`, delete guard)             |
| 422    | Validation failed (`issues[]` has field-level detail)       |
| 429    | Rate-limited — per-IP 300/min globally; stricter on code-sending (5 / 5 min), login/verify (10/min) and order placement (10/min) |
| 500    | Server error                                                |

**Auth:** short-lived **access token** (JWT) + long-lived **refresh token** (opaque,
DB-backed, rotating), issued by the standalone `package/auth` module. Two principal kinds,
distinguished by a `type` claim (`admin` / `customer`).

Each login comes in **two client profiles**:
- **Web** (`/web/*`) → tokens delivered as **httpOnly cookies** (`access_token`,
  `refresh_token`) plus a readable `csrf_token`. State-changing cookie calls (e.g.
  `/web/refresh`) require the cookie value echoed in an `X-CSRF-Token` header
  (double-submit). CORS is credentialed; the browser sends cookies automatically.
- **Mobile** (`/mobile/*`) → tokens returned in the JSON body
  (`accessToken`, `refreshToken`, `expiresIn`); the app sends
  `Authorization: Bearer <accessToken>`.

Guards accept the access token from **either** the Bearer header or the cookie. A
customer token on an admin route (or vice-versa) returns `403`; missing/invalid/expired
→ `401`. When a **rotated** (already-used) refresh token is presented, every session for
that principal is revoked (theft defence). Public browse endpoints need no token and
only ever return active data; **placing an order requires a customer token** (guests
browse and fill a cart, but must sign in to order).

**Session endpoints** (same shape on both auth surfaces; `{surface}` = `auth` for
customers, `admin/auth` for admins):
| Endpoint                              | Purpose                                       |
| ------------------------------------- | --------------------------------------------- |
| `POST /{surface}/web/refresh`         | Rotate via refresh **cookie** (needs CSRF)    |
| `POST /{surface}/web/logout`          | Revoke this session, clear cookies            |
| `POST /{surface}/web/logout-all` 🔒    | Revoke all of this principal's sessions       |
| `POST /{surface}/mobile/refresh`      | Rotate via `{ refreshToken }` in body         |
| `POST /{surface}/mobile/logout`       | Revoke `{ refreshToken }`                      |
| `POST /{surface}/mobile/logout-all` 🔒 | Revoke all of this principal's sessions       |

---

## Health

### `GET /health`
Liveness/readiness probe (no `/api/v1` prefix). Not wrapped in the envelope.
```json
{ "status": "ok", "uptime": 12.34, "timestamp": "2026-07-13T02:22:07.318Z" }
```

---

## Customer Auth (`/api/v1/auth`)

Customers browse as **guests**; an account is needed to place orders and for their
own profile/orders. Three sign-in methods (see
[`backend/docs/PACKAGE_AUTH.md`](../backend/docs/PACKAGE_AUTH.md) for the architecture):

| Method | Endpoints | Notes |
| ------ | --------- | ----- |
| **Email + password** (primary) | `/register/request` → `/{web,mobile}/register/verify` · `/{web,mobile}/login` | **verify-first** — the account is created only after the emailed code is confirmed |
| **Google Sign-In** | `/{web,mobile}/google` | **disabled** — no verifier registered; both endpoints return `400 "GOOGLE sign-in is not enabled"` |
| **Mobile number + OTP** | `/otp/request` → `/{web,mobile}/otp/verify` | **login-only** — works for phones already linked to an account (via `/me/link`); registration is always by email |

Apple Sign-In is planned (same shape as Google). Email and phone are each unique to
one account. Every login method returns the same `customer` object (includes
`hasPassword`, never the hash) and delivers tokens per profile (web cookies / mobile
JSON body).

> **Email codes are real** — delivered via Resend; they are never echoed in responses
> and there is no bypass. **SMS codes are provider-managed** — Message Central
> generates, delivers, and validates them once its credentials are set in `.env`.
> Without credentials a console fallback issues a local code (echoed as `devCode`
> in non-production responses); `OTP_BYPASS=true` would instead accept the fixed
> `OTP_DEV_CODE` (**`123456`**).

### `POST /api/v1/auth/register/request` → `201`
```jsonc
{ "email": "ravi@example.com", "password": "Passw0rd123", "name": "Ravi" }  // name optional
```
Step 1 of **verify-first registration**: validates the whole form (password ≥ 8 chars —
errors surface before any code is sent), checks the email is free (`409` if registered),
and emails a verification code (via Resend). **No account is created yet**, and the code
is never included in the response.
```jsonc
{ "success": true, "data": { "channel": "EMAIL", "destination": "ravi@example.com",
                             "expiresInMinutes": 5 } }
```
`502` if the email could not be sent.

### `POST /api/v1/auth/web/register/verify`  ·  `POST /api/v1/auth/mobile/register/verify` → `201`
```jsonc
{ "email": "ravi@example.com", "password": "Passw0rd123", "name": "Ravi", "code": "123456" }
```
Step 2: consumes the code and **creates the account** (email pre-verified) + signs the
customer in (cookies on web; tokens in body on mobile):
```jsonc
{ "success": true, "data": { "customer": { …, "emailVerifiedAt": "…", "hasPassword": true },
                             "isNewUser": true } }
```
`401` on a wrong/expired code; `409` if the email was claimed in the meantime.

### `POST /api/v1/auth/web/login`  ·  `POST /api/v1/auth/mobile/login`
```jsonc
{ "email": "ravi@example.com", "password": "Passw0rd123" }
```
`401` on bad credentials — same message whether the email is unknown, the password is
wrong, or the account has no password (social/OTP-only).

### `POST /api/v1/auth/password/forgot` → `201`
```jsonc
{ "email": "ravi@example.com" }
```
Always reports success (no account enumeration); a reset code is emailed only when the
address belongs to an account. The code appears only in that email.

### `POST /api/v1/auth/password/reset`
```jsonc
{ "email": "ravi@example.com", "code": "123456", "newPassword": "NewPassw0rd" }
```
Sets the new password and **revokes every session** for the account. `401` on a bad code.

### `POST /api/v1/auth/web/google`  ·  `POST /api/v1/auth/mobile/google`
```jsonc
{ "idToken": "<Google ID token>" }
```
Resolution: already-linked Google account → sign in; else a customer owning the
(Google-verified) email → Google gets linked to them; else a new customer is created
with the email pre-verified. Response is `{ customer, isNewUser }` + tokens per profile.
`401` on an invalid token.
> **Disabled for now:** the provider registry has **no Google verifier registered**
> (`providers/index.ts` — the mock verifier file exists but is unplugged), so both
> endpoints currently answer **`400 "GOOGLE sign-in is not enabled"`**. Enabling it =
> registering a verifier (real verification: google-auth-library + `GOOGLE_CLIENT_ID`).

### `POST /api/v1/auth/otp/request` → `201`
```jsonc
{ "phone": "9876543210" }
```
**Login-only** — OTP sign-in never creates an account. `404` (with guidance) if the
phone is not linked to any customer; link it first via `/me/link` after an email login.
`429` if a code for this number is already in flight (Message Central); `502` if the
SMS service fails.
```jsonc
{ "success": true, "data": { "channel": "SMS", "destination": "9876543210",
                             "expiresInMinutes": 5 } }   // devCode only on the dev fallback
```

### `POST /api/v1/auth/web/otp/verify`  ·  `POST /api/v1/auth/mobile/otp/verify`
```jsonc
{ "phone": "9876543210", "code": "123456" }
```
Verifies the code and signs in the account that owns the phone (re-stamps
`phoneVerifiedAt`). `404` if the phone is unlinked; `401` on wrong/expired code or after
`OTP_MAX_ATTEMPTS` failures.

### `GET /api/v1/auth/me` 🔒 customer
The logged-in customer's profile (includes `hasPassword`).

### `PATCH /api/v1/auth/me` 🔒 customer
```jsonc
{ "name": "Ravi", "altPhone": "9123456780", "avatarUrl": "https://…" }   // all optional
```
Only `name` / `altPhone` / `avatarUrl` are editable here. Email and phone are **login
identifiers** and can only be changed via the verified linking flow below.

### `GET /api/v1/auth/me/orders` 🔒 customer
The customer's own orders (most recent first), each with its line items.

### `POST /api/v1/auth/me/password` 🔒 customer
```jsonc
{ "currentPassword": "old…", "newPassword": "new…" }
```
Changes the password (`401` if `currentPassword` is wrong). On a social/OTP-only account
(no password yet) `currentPassword` is omitted — this **sets** the first password.
Every **other** session is revoked (a leaked password must not leave stolen sessions
alive); the session that made the change stays signed in. Response:
`{ "passwordChanged": true, "revokedSessions": 2 }`.

### Account linking 🔒 customer
Add the *other* identifier to your account, verified by a code to the new identifier.
This is how a mobile number becomes an OTP sign-in method (registration is email-only).
There is no separate post-register email-verify flow — emails are verified **before**
the account is created.

**`POST /api/v1/auth/me/link/request`** → `201`
```jsonc
{ "phone": "9876500011" }   // OR { "email": "…" } — the identifier you don't have yet
```
`409` if that email/phone is already linked to another account (or already on yours).

**`POST /api/v1/auth/me/link/verify`**
```jsonc
{ "phone": "9876500011", "code": "531542" }
```
On success the identifier is set + marked verified on your account. `409` if it was
claimed by another account in the meantime.

---

## Admin Auth (`/api/v1/admin/auth`)

### `POST /api/v1/admin/auth/web/login`  ·  `POST /api/v1/admin/auth/mobile/login`
```jsonc
{ "email": "admin@store.com", "password": "…" }
```
Verifies credentials, then delivers per profile:
```jsonc
// web  → Set-Cookie: access_token, refresh_token, csrf_token
{ "success": true, "data": { "admin": { id, email, name, role, … } } }
// mobile
{ "success": true, "data": { "admin": { id, email, name, role, … },
    "accessToken": "…", "refreshToken": "…", "expiresIn": "15m" } }
```
`401` on bad credentials (same message whether email or password is wrong).

### `GET /api/v1/admin/auth/me` 🔒 admin
The logged-in admin's profile.

> **Bootstrap the first admin** (no signup endpoint by design):
> `npm run create-admin -- <email> <password> ["Full Name"]`

---

## Customer Stores — `/api/v1/stores` 🔒 customer

A customer account can own multiple stores; every endpoint is scoped to the
signed-in customer (someone else's store id → `404`, never `403`). Lists are
small, so no pagination. The `:id` param accepts the store's **id or slug**
interchangeably.

### `GET /api/v1/stores`
The customer's stores, oldest first. Each: `{ id, name, slug, logoUrl, theme,
homepage, footer, isPublished, createdAt, updatedAt }`. `theme` is the Appearance JSON
(`backgroundColor`, `primaryColor`, plus nullable `secondaryColor` —
links/prices/highlights —, `surfaceColor` — cards/panels — and
`buttonTextColor` — text on CTA buttons; `null` means Auto: secondary
follows primary, surface derives from the background, button text is
white/black by the primary's luminance).
`homepage` is the
storefront section list — an **ordered** array of `{ key, enabled }` over
`hero`, `categories`, `featured`, `newArrivals`, `bestSellers` (default: that
order, all enabled). `slug` is auto-generated from the name
(unique, stable across renames) and forms the store's public URL;
`isPublished` (default `false`) gates the public page. `footer` is the
storefront footer configuration (see `PATCH …/footer` below), always returned
resolved to its complete shape.

### `POST /api/v1/stores` → `201`
```json
{ "name": "Anwin's Sports Hub" }
```
`name` required (1–60 chars). The store is created with the default theme, an
auto-generated unique `slug`, and `isPublished: false`. The logo is uploaded
separately (`PUT /stores/:id/logo`) — never sent as JSON.

### `GET /api/v1/stores/:id`
One of the customer's stores. `404` if not found / not owned.

### `GET /api/v1/stores/:id/dashboard`
Seller dashboard for one store — order counters + the latest 8 orders.
```jsonc
{ "stats": {
    "today": 3,            // orders placed since local midnight
    "pending": 5,          // status PENDING (new orders)
    "processing": 0,       // CONFIRMED + PACKED  ─┐ progressed via the
    "shipped": 0,          //                      ├ seller order endpoints
    "completed": 0,        // DELIVERED           ─┘ below
    "cancelled": 0,
    "refunded": 0,         // paymentStatus REFUNDED (today only via
                           // cancelling a paid dev-simulated order)
    "totalOrders": 5,
    "revenue": "12495.00"  // sum of non-cancelled order totals
  },
  "recentOrders": [ { "id", "orderNumber", "status", "fulfilment",
    "customerName", "paymentMethod", "paymentStatus", "total",
    "placedAt", "itemCount" } ] }
```

### Seller order management — `/api/v1/stores/:id/orders`

The store's orders, worked by the seller. The lifecycle is **forward-only**:
`PENDING → CONFIRMED → PACKED → SHIPPED → DELIVERED`, with jumps ahead
allowed (a pickup order goes `PACKED → DELIVERED` without ever being
`SHIPPED`) and never backwards. `CANCELLED` sits outside the sequence and
has its own endpoint because it restores stock.

**`GET /api/v1/stores/:id/orders`** — newest first, server-paginated.

| Query      | Type | Default | Notes                                        |
| ---------- | ---- | ------- | -------------------------------------------- |
| `status`   | enum | –       | `PENDING · CONFIRMED · PACKED · SHIPPED · DELIVERED · CANCELLED` |
| `q`        | string | –     | Matches order number or customer name/phone  |
| `page`     | int  | 1       |                                              |
| `pageSize` | int  | 20      | max 100                                      |

List envelope of summary rows: `{ id, orderNumber, status, fulfilment,
customerName, paymentMethod, paymentStatus, total, placedAt, itemCount }`.

**`GET /api/v1/stores/:id/orders/:orderId`** — one order, full shape (same
as order placement below, incl. the lifecycle stamps). `404` if not this
store's.

**`PATCH /api/v1/stores/:id/orders/:orderId/status`**
```jsonc
{ "status": "CONFIRMED" }   // CONFIRMED | PACKED | SHIPPED | DELIVERED
```
Moves the order forward and stamps the matching timestamp
(`confirmedAt` / `packedAt` / `shippedAt` / `deliveredAt`). Marking a COD
order `DELIVERED` also flips `paymentStatus` to `PAID` (cash changed hands
at the door). `409` when the move isn't forward, the order is cancelled, or
a concurrent update won the race. Returns the full order.

**`POST /api/v1/stores/:id/orders/:orderId/cancel`**
```jsonc
{ "reason": "Out of stock" }   // optional (≤ 300 chars); body may be empty
```
Cancels the order — allowed only while it hasn't shipped (`PENDING` /
`CONFIRMED` / `PACKED`; `409` otherwise). In one transaction the items'
stock is **restored** (lines whose product/variant was deleted since are
skipped) and product aggregates recompute. A `PAID` order flips to
`paymentStatus: REFUNDED` — today that can only be a dev-simulated online
payment, so the refund is equally simulated; the real refund flow arrives
with the payment gateway. Returns the full order (`cancelledAt` +
`cancelReason` set).

### `PATCH /api/v1/stores/:id`
Update `name`. Renaming does **not** change the slug, so shared links keep
working.

### `PUT /api/v1/stores/:id/logo` (multipart)
Upload or replace the store logo — one multipart `file` part (image;
validated against the `logo` rule of `GET /public/media-config`). Stored in
the dedicated **logo bucket**; the DB keeps only the object key and responses
carry a derived `logoUrl`. Returns the full store. Oversized → `413`,
unsupported type → `400`.

### `DELETE /api/v1/stores/:id/logo`
Remove the logo (`logoUrl` becomes `null`). Returns the full store.

### `PATCH /api/v1/stores/:id/theme`
Partial update of the theme object (unknown keys rejected; colors must be
`#rrggbb`; `secondaryColor`/`surfaceColor`/`buttonTextColor` also accept
`null` = reset to Auto — button text on Auto is white or near-black picked
from the primary color's luminance). Returns the full store with the merged
theme.

### `PATCH /api/v1/stores/:id/homepage`
```jsonc
{ "sections": [                       // FULL ordered list, not a subset
  { "key": "newArrivals", "enabled": true },
  { "key": "hero",        "enabled": true },
  { "key": "featured",    "enabled": false },
  { "key": "categories",  "enabled": true },
  { "key": "bestSellers", "enabled": true }
] }
```
Set the storefront homepage section **order** and per-section visibility in one
write — a reorder and a toggle are the same operation. `sections` must be a
complete permutation of every known key (`hero`, `categories`, `featured`,
`newArrivals`, `bestSellers`), each with an `enabled` flag; a missing,
duplicate or unknown key is a `422`. Returns the full store (with `homepage`
normalised to the ordered list).

Enabling a section can only ever *reveal* it — it never forces an empty row to
appear, since a merchandising row still needs products flagged for it. Disabled
sections are not queried at all. Adding a new section key later makes it appear
(enabled, at the end) for existing stores automatically — no migration.

### `PATCH /api/v1/stores/:id/footer`

Update the storefront **footer** content. The body carries any subset of the
footer **sections** — a present section replaces that section wholesale (the
management page saves one card at a time); absent sections are untouched. At
least one section is required (`422` otherwise). Returns the full store.

```jsonc
{
  "locations": [                    // max 10 — business locations
    {
      "id": "…",                    // omit/null on a new row — the server mints one
      "label": "Head Office",       // optional branch name
      "address": "12/4 MG Road, Kochi, Kerala 682016",   // REQUIRED
      "contactPerson": "Rahul",     // optional
      "phone": "+91 98765 43210",   // REQUIRED
      "altPhone": null,             // optional
      "email": "hello@store.com",   // REQUIRED
      "hours": "Mon–Sat, 9 AM – 8 PM",   // optional
      "isPrimary": true,            // exactly one is kept primary (first wins)
      "lat": 9.9312, "lng": 76.2673 // optional map pin — both or neither
    }
  ],
  "social": {                       // URLs; whatsapp is a NUMBER (wa.me link)
    "facebook": "https://facebook.com/…", "instagram": null, "youtube": null,
    "whatsapp": null, "x": null, "linkedin": null, "telegram": null,
    "pinterest": null
  },
  "info": { "about": "…", "establishedYear": 2005,
            "gstNumber": null, "registrationNumber": null },
  "support": { "email": null, "phone": null, "whatsapp": null, "hours": null },
  "policies": {                     // external URLs until policy PAGES land
    "privacy": null, "terms": null, "shipping": null,
    "returns": null, "cancellation": null
  },
  "links": [ { "label": "FAQ", "url": "https://…" } ],  // max 10; url may also
                                                        // be an in-app /path
  "copyrightText": null             // null = "© {year} {store name}. All Rights Reserved."
}
```

Stored as the `Store.footer` JSON column (same evolve-without-migration
pattern as `theme` / `homepage`). Every store response returns `footer`
**resolved** to the complete shape above — missing sections defaulted, at
most one primary location — so clients never normalise it themselves.

### `PATCH /api/v1/stores/:id/payments`
```jsonc
{ "acceptOnlinePayment": true, "acceptCod": true }
// any subset (≥ 1 key) — absent keys are kept
```
The store's payment acceptance switches (**how customers pay**), stored as
the `Store.payments` JSON column (defaults: COD **on**, online off).
`acceptOnlinePayment` = customers pay through Unie Max (payouts go to the
seller's primary bank account; the gateway arrives with the payments
module), `acceptCod` = cash on delivery. Every store response returns
`payments` resolved to the complete shape, and the **public shell** includes
it too, so the checkout can show what the store accepts. Returns the full
store.

### `PATCH /api/v1/stores/:id/shipping`
```jsonc
{ "mode": "DELIVERY" }   // DELIVERY · PICKUP · BOTH
```
The store's fulfilment mode (**how customers receive orders**): the seller
delivers, customers pick up from a business location, or both. Stored as
the `Store.shipping` JSON column (default `DELIVERY`; the shipping-charge
rules join this column later). Returned resolved on every store response
and in the public shell. Returns the full store.

### `PATCH /api/v1/stores/:id/checkout`
```jsonc
{ "name": true, "phone": true, "email": false, "address": true,
  "pincode": true, "state": true, "country": false }
// any subset (≥ 1 key) — absent keys are kept
```
Which customer fields this store's **checkout collects** — stored as the
`Store.checkout` JSON column, all seven default **true**. A disabled field
is hidden from the customer and excluded from checkout validation.
`name`/`phone`/`email` are contact fields (asked even for store pickup);
`address`/`pincode`/`state`/`country` are delivery fields (skipped for
pickup orders). Returned resolved on every store response and in the
public shell. Returns the full store.

### `PATCH /api/v1/stores/:id/publish`
```json
{ "isPublished": true }
```
Publish / unpublish the store's public page. Returns the full store.

### Payout bank accounts — `/api/v1/stores/:id/bank-accounts`

The seller's payout accounts (max **5** per store). Exactly one account is
**primary** — the only account that receives payouts from Unie Max when
customers pay through the platform. Every account carries a
**verification** state: it starts `PENDING` and will be verified by a
third-party account validator or manually by a Unie Max admin (admin panel
is a future module — the fields are provisioned now, the verification
endpoints arrive with it). Editing any bank detail of a verified account
resets it to `PENDING`.

**`GET /api/v1/stores/:id/bank-accounts`** — the store's accounts, oldest
first. Each:
```jsonc
{ "id", "accountHolderName", "accountNumber", "ifsc", "bankName", "branch",
  "upiId",                        // null when not provided
  "isPrimary",                    // the payout target — at most one true
  "verificationStatus": "PENDING | VERIFIED | FAILED",
  "verificationMethod": "THIRD_PARTY | MANUAL | null",
  "verificationNote": null,       // failure reason / admin note
  "verifiedAt": null, "createdAt", "updatedAt" }
```

**`POST /api/v1/stores/:id/bank-accounts`** → `201`
```jsonc
{
  "accountHolderName": "Anwin Paulji",   // required (1–100)
  "accountNumber": "50100123456789",     // required — 9–18 digits
  "ifsc": "HDFC0001234",                 // required — [A-Z]{4}0[A-Z0-9]{6} (uppercased)
  "bankName": "HDFC Bank",               // required (1–100)
  "branch": "MG Road, Kochi",            // required (1–100)
  "upiId": "name@okhdfcbank",            // optional (VPA shape)
  "isPrimary": true                       // optional — the FIRST account is
                                          // primary automatically regardless
}
```
`409` on the 6th account or when the same `accountNumber` + `ifsc` is
already saved for this store. Created `PENDING`.

**`PATCH /api/v1/stores/:id/bank-accounts/:accountId`** — partial update
(≥ 1 field). Any changed bank detail resets the verification to `PENDING`.
`isPrimary` accepts **only `true`** — promoting an account demotes the
current primary in the same transaction, so the payout target can never be
silently unset. Returns the updated account.

**`DELETE /api/v1/stores/:id/bank-accounts/:accountId`** →
`{ "data": { "id" } }`. Deleting the primary does **not** auto-promote
another account (payouts must never silently retarget) — the seller picks
the next primary explicitly, and payouts stay on hold until they do.

### Store catalog — categories, subcategories, products & variants

The catalog **inside one customer store** (separate from the admin's global
catalog), following the hierarchy **Store → Category → Subcategory
(optional) → Product → Variants**. The setup sequence is enforced: a
product requires a category (root **or** subcategory) of the same store,
so at least one category must exist before the first product can be added.
Category nesting is one level deep — a subcategory cannot have children.

**`GET /api/v1/stores/:id/categories`** — the store's categories (roots and
subcategories, flat), oldest first. Each: `{ id, name, slug, parentId,
isActive, isFeatured, productCount, subcategoryCount, createdAt }`
(`parentId` is `null` for root categories). `slug` is the category's URL
identity on the storefront (`/store/{storeSlug}/category/{slug}`), generated
from the name on create and **stable across renames**. `isFeatured` surfaces a
root category in the storefront homepage's Featured Categories row.

**`POST /api/v1/stores/:id/categories`** → `201`
```jsonc
{ "name": "Cricket Bats", "parentId": "cmr…" }   // parentId optional → subcategory
```
`name` required (1–60 chars), unique per store case-insensitively (`409` on
duplicate). `parentId` must be a **root** category of the same store
(`400` otherwise — one level of nesting only). Created enabled.

**`PATCH /api/v1/stores/:id/categories/:categoryId`** — partial update;
send any subset (at least one required, `422` otherwise).
```jsonc
{ "name": "Mobiles" }        // rename (slug does NOT change)
{ "isActive": false }        // enable/disable
{ "isFeatured": true }       // show in the homepage Featured Categories row
```
`name` (1–60 chars) must stay unique per store case-insensitively, ignoring
the row being edited, so re-saving an unchanged name is not a conflict
(`409` on a real duplicate). `isActive` enables/disables the category on the
public storefront (a disabled category hides everything inside it publicly —
products and subcategories; their own flags are untouched). `slug` is
deliberately **not** updatable — renaming keeps shared links working.
Re-parenting is not supported. Returns the updated category.

**`DELETE /api/v1/stores/:id/categories/:categoryId`** — `409` if the
category still has products **or subcategories**. → `{ "data": { "id" } }`

> **The variant is the unit of sale.** A product has no price column of its
> own: every product owns at least one variant, and a product *without*
> options carries a single implicit variant named `Default`. Product-level
> `price` / `priceMax` / `stockQuantity` in responses are **derived** from the
> variants and are read-only.

**`GET /api/v1/stores/:id/products`** — the store's products, newest first.
Each:
```jsonc
{
  "id": "cmr…", "name": "iPhone 17", "slug": "iphone-17", "description": null,
  "price": "89900.00",      // cheapest variant ("from" price); null if nothing sellable
  "priceMax": "109999.00",  // dearest variant — equal to price unless options differ
  "stockQuantity": 28,      // total across variants
  "hasVariants": true,      // false → only the implicit Default variant
  "defaultVariant": null,   // { id, price, stockQuantity } when hasVariants is false
  "isActive": true,
  // Merchandising — each flag maps to exactly one storefront section
  "isFeatured": false, "isBestSeller": false, "isNewArrival": false,
  "hideFromSearch": false,
  "category": { "id": "cmr…", "name": "Smartphones", "slug": "smartphones", "parentId": "cmr…" },
  "variants": [ { "id", "name", "price", "stockQuantity", "isActive", "createdAt" } ],
  "media":    [ { "id", "type": "IMAGE|VIDEO", "url", "altText", "displayOrder" } ],
  "createdAt": "…"
}
```
`variants` lists **real options only** — the implicit `Default` is never
included; edit it through `defaultVariant.id` instead. Decimals serialize as
strings. `media` is ordered (images by `displayOrder` — the first image is
the **cover** — video last); `url` is derived from storage config, the DB
holds only object keys.

**`POST /api/v1/stores/:id/products`** → `201`

`hasVariants` (default `false`) is the explicit discriminator between the two
product shapes, so a payload is never ambiguous.

**Simple product** — `price` + `stockQuantity` required, `variants` rejected:
```jsonc
{
  "name": "English Willow Bat",   // required (1–120 chars)
  "categoryId": "cmr…",           // required — root or subcategory of this store (400 otherwise)
  "description": "…",             // optional (max 2000)
  "hasVariants": false,
  "price": 4999,                  // required (>= 0)
  "stockQuantity": 20             // required (int >= 0)
}
```
**Variant product** — at least one variant, each with name + price + stock;
top-level `price`/`stockQuantity` are not accepted:
```jsonc
{
  "name": "iPhone 17", "categoryId": "cmr…",
  "hasVariants": true,
  "variants": [                    // max 50, names unique (case-insensitive)
    { "name": "128 GB", "price": 79999, "stockQuantity": 10 },
    { "name": "256 GB", "price": 89999, "stockQuantity": 5 }
  ]
}
```
`422` with a field-level `issues[]` when: `hasVariants` is false and `price`
or `stockQuantity` is missing (or `variants` were sent anyway); or
`hasVariants` is true and `variants` is empty / a row is missing its name,
price or stock / names collide.

> The wire field is `stockQuantity` (not `stock`) everywhere — request bodies,
> responses and the DB column all use the same name.

**`PATCH /api/v1/stores/:id/products/:productId`** — partial update; send any
subset (at least one field required, `422` otherwise).
```jsonc
{ "name": "…" }              // rename (the slug/public URL never changes)
{ "description": "…" }       // set the description; null (or "") clears it
{ "categoryId": "…" }        // move to another category of the SAME store
{ "isActive": false }        // enable/disable on the storefront
{ "isFeatured": true }       // Featured Products row
{ "isBestSeller": true }     // Best Sellers row
{ "isNewArrival": true }     // New Arrivals row
{ "hideFromSearch": true }   // excluded from search; still browsable by category
```
`categoryId` must reference a category (root or subcategory) of the same
store — anything else is a `400`, exactly as on create. `isActive` controls
storefront visibility (visible publicly only when the product **and** its
category — and, for subcategories, the parent — are active). The `is*`/`hide*`
booleans are **merchandising** flags letting a merchant curate the homepage
without code changes. Each section flag maps to **exactly one** row and
affects nothing else. Price and stock are not here — they live on the
variants (PATCH the variant, or `defaultVariant.id` for an option-less
product). Returns the updated product.

**`DELETE /api/v1/stores/:id/products/:productId`** → `{ "data": { "id" } }`
Variants are deleted with the product.

**Variants** — every variant mutation returns the **full parent product**
(with its `variants` array), so clients can replace one product row in
place:

**`POST /api/v1/stores/:id/products/:productId/variants`** → `201`
```jsonc
{ "name": "Red / 128 GB", "price": 5299, "stockQuantity": 4 }  // price REQUIRED
```
`name` unique per product case-insensitively (`409` on duplicate). Adding the
**first** option to a product that only had its implicit `Default` variant
removes that `Default` — the product now sells through its options.

**`PATCH /api/v1/stores/:id/products/:productId/variants/:variantId`**
```jsonc
{ "name": "…", "price": 5499, "stockQuantity": 2, "isActive": false }  // all optional
```
A variant's price can be changed but never cleared. This is also how the price
and stock of an option-less product are edited — patch its `defaultVariant.id`.

**`DELETE /api/v1/stores/:id/products/:productId/variants/:variantId`**
Deleting the **last remaining** variant does not leave the product unsellable:
that variant is demoted back to the implicit `Default` (keeping its price and
stock), so the product simply becomes an option-less product again.

**Media** — up to **8 images + 1 video** per product; the image with the
lowest `displayOrder` is the **cover**. Files go to the product-media bucket;
rows store only object keys. Like variants, every mutation returns the **full
parent product**:

**`POST /api/v1/stores/:id/products/:productId/media`** (multipart) → `201`
One `file` part — an image or a video (the content type picks the rule from
`GET /public/media-config`). New images append after existing ones; a 9th
image or 2nd video is a `409`. Oversized → `413`, unsupported type → `400`.

**`PUT /api/v1/stores/:id/products/:productId/media/order`**
```jsonc
{ "mediaIds": ["…", "…"] }   // ALL image ids, in the desired order
```
Reorders the images — the first id becomes the cover. Must be exactly the
product's image ids (`400` otherwise); the video is not part of the ordering.

**`PATCH /api/v1/stores/:id/products/:productId/media/:mediaId`**
```jsonc
{ "altText": "Red cricket bat, front view" }   // null (or "") clears it
```
Metadata only — alt text for accessibility.

**`PUT /api/v1/stores/:id/products/:productId/media/:mediaId/file`** (multipart)
Replace the media item's file, keeping its position and alt text. The new
file must match the slot's type (image→image, video→video; `400` otherwise).

**`DELETE /api/v1/stores/:id/products/:productId/media/:mediaId`**
Removes the media item (and its stored object). Deleting the cover promotes
the next image.

### `GET /api/v1/public/media-config` (no auth)

The upload rules the server enforces, for client-side hints + pre-upload
validation: `{ image | video | logo: { maxMB, contentTypes[] } }` — driven by
the `MEDIA_MAX_*_MB` / `MEDIA_*_TYPES` env vars.

---

## Customer Addresses — `/api/v1/addresses` 🔒 customer

The signed-in customer's **address book** (max **10**). Exactly one address
is **primary** — the default suggestion at checkout: the first saved
address is primary automatically, promoting another demotes it in the same
transaction, and deleting the primary promotes the oldest remaining.
Checkout lists these as selectable suggestions; guests simply fill the
form instead.

**`GET /api/v1/addresses`** — primary first, then oldest first. Each:
```jsonc
{ "id", "label",                 // optional list label ("Home", "Work"…)
  "name", "phone", "email",     // email nullable — not every store collects it
  "addressLine", "pincode", "state", "country",
  "isPrimary", "createdAt", "updatedAt" }
```

**`POST /api/v1/addresses`** → `201`
```jsonc
{
  "label": "Home",                          // optional (≤ 40)
  "name": "Ravi Kumar",                     // required (1–100)
  "phone": "+91 98765 43210",               // required
  "email": "ravi@example.com",              // optional
  "addressLine": "12/4 MG Road, Kochi",     // required (1–300)
  "pincode": "682016",                      // required (3–10 alphanumeric)
  "state": "Kerala",                        // required
  "country": "India",                       // defaults to "India"
  "isPrimary": true                          // optional — first address is
                                             // primary automatically
}
```
`409` on the 11th address.

**`PATCH /api/v1/addresses/:addressId`** — partial update (≥ 1 field).
`isPrimary` accepts **only `true`** (promote; demoting happens by promoting
another). Returns the updated address.

**`DELETE /api/v1/addresses/:addressId`** → `{ "data": { "id" } }` — the
oldest remaining address becomes primary when the primary was deleted.

---

## Public Stores — `/api/v1/public/stores` (no auth)

The storefront is **multi-page**, so this surface is split per page rather
than returning one catalog blob. That is deliberate: a store with thousands
of products must never ship its whole catalog to render a page. The shell is
fetched once and reused; products are queried a page at a time with all
filtering, sorting and pagination done in SQL.

Every endpoint serves **published** stores only — unknown *and* unpublished
slugs both return `404`, so unpublished stores are indistinguishable from
non-existent ones. One exception: the **owner draft preview**. No auth is
required, but a customer session (cookie or bearer) is still resolved
best-effort — never a `401` — and if the viewer **owns** the store, an
unpublished slug resolves too, so owners can check their storefront before
publishing (the shell's `isPublished: false` tells the client it's a draft).
For any other viewer the `404` behaviour is unchanged.
All endpoints apply the same **visibility rule**: a product appears
only when it is active, has at least one enabled variant, and its whole
category chain is active (a disabled root hides its subcategories' products
too). Decimals serialize as strings.

### `GET /api/v1/public/stores`
Marketplace store **index** — published stores only, newest publish first
(feeds the homepage "New Stores" rail). Ordered by `publishedAt` (stamped on
a store's **first** publish — re-publishing an old store doesn't bump it),
nulls last, then `createdAt`. Each card carries a taste of the catalog:
`productCount` (publicly visible products) and `previewImages` (cover-image
URLs of the newest visible products that have a photo, max 4) — both follow
the same visibility rule the store page enforces.

| Query      | Type | Default | Notes            |
| ---------- | ---- | ------- | ---------------- |
| `page`     | int  | 1       |                  |
| `pageSize` | int  | 20      | max 100          |

```jsonc
{ "success": true,
  "data": [ { "id", "name", "slug", "logoUrl", "publishedAt",
              "productCount": 12, "previewImages": ["https://…", …] } ],
  "meta": { "total", "page", "pageSize", "totalPages" } }
```

### `GET /api/v1/public/stores/:slug`
The storefront **shell** — branding, theme and the category tree, with **no
products**. Small and cacheable; fetched once per store visit.

```jsonc
{ "id", "name", "slug", "logoUrl", "theme",
  "isPublished",                  // false only on an owner draft preview
  "footer": { … },                // owner-managed footer content, resolved to the
                                  // full shape (see PATCH /stores/:id/footer)
  "payments": { "acceptOnlinePayment", "acceptCod" },
  "shipping": { "mode": "DELIVERY | PICKUP | BOTH" },
  "checkout": { "name", "phone", "email", "address", "pincode", "state", "country" },
  "categories": [                 // enabled ROOT categories with something shoppable
    { "id", "name", "slug", "isFeatured",
      "productCount",             // includes its subcategories' products
      "subcategories": [ { "id", "name", "slug", "productCount" } ] }
  ] }
```
Categories with nothing shoppable are omitted, so the header dropdown never
offers a dead end.

### `GET /api/v1/public/stores/:slug/products`
Paginated product listing — powers the category page and search results.

| Query      | Type   | Default  | Notes                                            |
| ---------- | ------ | -------- | ------------------------------------------------ |
| `category` | string | –        | Category **slug**; a root also covers its subcategories (`404` if unknown) |
| `q`        | string | –        | Matches name + description; skips `hideFromSearch` products |
| `section`  | enum   | –        | `featured` · `newArrivals` · `bestSellers` — only products flagged for that homepage row (the "View all" scope) |
| `sort`     | enum   | `newest` | `newest` · `popular` · `bestselling` · `price-asc` · `price-desc` · `alphabetical` |
| `minPrice` / `maxPrice` | number | – | Compared against the "from" price |
| `inStock`  | bool   | –        | Only products with stock                          |
| `page`     | int    | `1`      |                                                   |
| `pageSize` | int    | `20`     | Max `100`                                         |

Returns the **list envelope**: `{ data: [ … ], meta: { total, page, pageSize,
totalPages } }`. Each product is the lean listing shape — variants are
represented by a **count**, never sent in full:
```jsonc
{ "id", "name", "slug", "description",
  "price",          // cheapest sellable variant — the "from" price
  "priceMax",
  "stockQuantity",  // total across sellable variants
  "variantCount",   // real options; 0 = simple product, no picker needed
  "category": { "name", "slug" },
  "image": { "url", "altText" } | null }  // COVER image only — a card never needs more
```
`popular` / `bestselling` order by the owner's Best Seller flag then recency —
there is no sales data yet; they become real orderings when orders ship.

### `GET /api/v1/public/stores/:slug/home`
Homepage merchandising payload — each product section capped at 12.
```jsonc
{ "sections": [ { "key": "hero", "enabled": true }, … ],  // ORDERED
  "featuredCategories": [ … ],  // owner-flagged roots, else all top-level
  "featured": [ … ], "newArrivals": [ … ], "bestSellers": [ … ] }
```
`sections` is the owner's ordered list (see `PATCH …/homepage`) and drives
**both** what the storefront renders and in what order. A section switched
**off** comes back with its data array empty and is never queried; `hero`
carries no data, so the client reads its `enabled` flag directly.
Products use the same listing shape. Each product section is **strictly
flag-driven**: a product appears in `featured` / `newArrivals` / `bestSellers`
if and only if the matching flag is set. There is deliberately **no fallback** —
an unflagged section returns `[]` and the storefront omits it.

> Earlier revisions substituted recent products into an empty section, which
> meant flagging a product as a New Arrival also surfaced it under Featured
> Products (that section was empty, so it fell back to everything). A flag now
> means exactly one thing.

`featuredCategories` is the exception, and is navigation rather than
merchandising: the row is headed "Shop by Category", so it lists every
top-level category when the owner has starred none, and narrows to the starred
set otherwise.

### `GET /api/v1/public/stores/:slug/categories/:categorySlug`
Category header + breadcrumb ancestry for the category page.
```jsonc
{ "id", "name", "slug",
  "parent": { "name", "slug" } | null,
  "subcategories": [ { "id", "name", "slug", "productCount" } ] }
```
A subcategory whose parent is disabled is itself unreachable (`404`).

### `GET /api/v1/public/stores/:slug/products/:productSlug`
Full product detail — the **only** endpoint that returns variants, because the
product page is where a customer picks one.
```jsonc
{ "id", "name", "slug", "description", "price", "priceMax", "stockQuantity",
  "category": { "name", "slug", "parent": { "name", "slug" } | null },
  "variants": [ { "id", "name", "price", "stockQuantity" } ],  // enabled OPTIONS only
  "media": [ { "id", "type": "IMAGE|VIDEO", "url", "altText" } ], // gallery, cover first
  "related": [ … ] }                                           // same category, max 8
```
A product with no options arrives with `variants: []` (the implicit `Default`
is never exposed) and its price/stock come from the product fields.

---

### Orders — `POST /api/v1/public/stores/:slug/orders` 🔒 customer → `201`

Place an order with one store. **Requires a signed-in customer** (`401`
without a valid customer token — the checkout page sends guests through
`/login?next=` first); the order is attached to the account that placed
it. **Published stores only** — an owner's draft preview can browse but
never sell.

```jsonc
{
  "fulfilment": "DELIVERY",          // DELIVERY | PICKUP — must be allowed by
                                     // the store's shipping mode
  "paymentMethod": "COD",            // ONLINE | COD — must be seller-enabled
  "customer": {                      // validated per the STORE's checkout-field
    "name": "Ravi", "phone": "+91 98765 43210", "email": null,
    "address": "12/4 MG Road, Kochi", // config: enabled fields are required
    "pincode": "682016", "state": "Kerala", "country": "India"
  },                                 // (address fields skipped for PICKUP)
  "items": [                         // references + quantities ONLY — prices
    { "productId": "cmr…", "variantId": null, "quantity": 2 }
  ]                                  // are re-read from the live catalog
}
```

Server-side: every line is re-priced from the catalog (client prices are
never trusted), visibility rules apply, and stock is decremented with a
guarded update inside the transaction — concurrent orders can't oversell
(`409` "just sold out" if they race). Product aggregates recompute in the
same transaction. Totals: `subtotal` + `shippingCharge` (0 until the
shipping-rules feature) = `total`.

**Payment:** `COD` orders start `paymentStatus: "PENDING"`. `ONLINE` is
**simulated outside production** — instantly `PAID` with
`paymentRef: "DEV-SIMULATED"`; in production it answers
**`503 "Online payment is not available yet"`** until the real gateway
lands, so a production build can never fake a payment.

Response: the full order —
```jsonc
{ "id", "orderNumber",              // e.g. "UM-MDL3X9K2-7QHT"
  "status": "PENDING", "storeName", "storeSlug",
  "fulfilment", "customerName", "customerPhone", "customerEmail",
  "addressLine", "pincode", "state", "country",   // null when not collected
  "subtotal", "shippingCharge", "total",          // decimal strings
  "paymentMethod", "paymentStatus", "paymentRef",
  "placedAt",
  "confirmedAt", "packedAt", "shippedAt",         // lifecycle stamps — null
  "deliveredAt", "cancelledAt", "cancelReason",   // until the seller gets there
  "items": [ { "id", "productName", "variantName", "productSlug",
               "imageUrl",          // cover snapshot (key-derived)
               "unitPrice", "quantity", "lineTotal" } ] }
```

### `GET /api/v1/public/stores/:slug/orders/:orderId` (no auth)

Confirmation lookup for the order-success page, keyed by the order's
unguessable cuid scoped to its store slug — anonymous so the confirmation
link keeps working in a fresh session. Same shape as above; `404` if
unknown.

### `GET /api/v1/orders` 🔒 customer

The signed-in customer's order history, newest first (max 100) — the
account **Orders** page. Full order shape (same as placement, including
per-item `imageUrl` thumbnails). The auth package's `GET /auth/me/orders`
predates this and returns a leaner shape without media.

---

## Marketplace Discovery — `/api/v1/public` (no auth)

Platform-wide, read-only surface behind the marketplace homepage (`/`).
Every query enforces the same visibility rules as the storefront (published
store; product + category chain active; sellable), so search can never
surface something a store page would hide.

### `GET /api/v1/public/search`

Grouped global search across the whole platform. Results are **always
grouped** — stores / categories / products, never interleaved.

| Query   | Type   | Default | Notes                              |
| ------- | ------ | ------- | ---------------------------------- |
| `q`     | string | —       | **required**, 2–120 chars          |
| `limit` | int    | 5       | cap **per group**, max 10          |

```jsonc
{ "success": true, "data": {
  "stores":     [ { "id", "name", "slug", "logoUrl" } ],
  "categories": [ { "id", "name", "slug", "parentName",      // "Cricket" in "Power Sports"
                    "store": { "name", "slug" } } ],
  "products":   [ { "id", "name", "slug", "price", "stockQuantity",
                    "categoryName", "store": { "name", "slug" },
                    "image": { "url", "altText" } | null } ] } }
```

Categories and products carry their **owning store**, because they only
exist inside one (`/store/{storeSlug}/category/{slug}`, `…/product/{slug}`
are their only addresses — there is no global category page). Category hits
require at least one visible product (a hit never lands on an empty page);
product hits respect the owner's `hideFromSearch` flag. Matching is
name-`contains` (categories/products) — the upgrade path at large scale is a
pg_trgm/FTS index behind the same contract.

### `GET /api/v1/public/products`

Platform-wide product rail — the **newest** discoverable products across all
published stores (feeds the homepage "Fresh Finds" row). Recency-only by
design (no popularity/analytics sort exists yet). Enforces the same rules as
global search: `PUBLIC_PRODUCT_VISIBILITY`, published store, and the owner's
`hideFromSearch` opt-out. Items share the search product-hit shape.

| Query      | Type | Default | Notes   |
| ---------- | ---- | ------- | ------- |
| `page`     | int  | 1       |         |
| `pageSize` | int  | 20      | max 100 |

```jsonc
{ "success": true,
  "data": [ { "id", "name", "slug", "price", "stockQuantity",
              "categoryName", "store": { "name", "slug" },
              "image": { "url", "altText" } | null } ],
  "meta": { "total", "page", "pageSize", "totalPages" } }
```

### `GET /api/v1/public/categories`

Homepage "Shop by Category" chips. Categories are per-store (no global
taxonomy), so this aggregates: the most common category **names** across
published stores, grouped case-insensitively (most frequent spelling wins),
ordered by spread, max 12. Only categories with at least one publicly
visible product count — a chip never leads to an empty search. Served from
a 60 s in-process cache.

```jsonc
{ "success": true, "data": [ { "name": "Cricket", "count": 7 }, … ] }
```

### `GET /api/v1/public/stats`

Marketplace trust counters — published stores, publicly visible products,
and orders placed (all statuses except `CANCELLED`; orders survive store
deletion, so the count never shrinks). Served from a 60 s in-process cache,
so homepage traffic costs one count-scan per minute.

```jsonc
{ "success": true, "data": { "stores": 18, "products": 642, "orders": 97 } }
```

---

## Categories (Public)

### `GET /api/v1/categories`
List **active** categories.

| Query      | Type    | Default | Notes                                  |
| ---------- | ------- | ------- | -------------------------------------- |
| `q`        | string  | —       | Search by name (case-insensitive)      |
| `parentId` | string  | —       | Filter to children of a category       |
| `rootOnly` | boolean | —       | `true` → top-level categories only     |
| `page`     | number  | 1       |                                        |
| `pageSize` | number  | 20      | max 100                                |

Each item includes `_count: { products, children }`.

### `GET /api/v1/categories/:slug`
Category detail by slug, including `parent` and **active** `children`.
`404` if not found.

---

## Categories (Admin) — `/api/v1/admin/categories` 🔒 admin

All routes require an admin token. Same list query as public, but returns **all**
categories (`isActive` filterable).

### `POST /api/v1/admin/categories` → `201`
```jsonc
{
  "name": "Hard Tennis Bats",   // required
  "description": "…",            // optional
  "imageUrl": "https://…",       // optional (must be a URL)
  "displayOrder": 0,             // optional
  "isActive": true,              // optional (default true)
  "parentId": "cmr…"             // optional (null/omit for root)
}
```
`slug` is auto-generated and made unique.

### `GET /api/v1/admin/categories/:id`
By id. `404` if not found.

### `PATCH /api/v1/admin/categories/:id`
Partial update (any create field). A category cannot be its own parent (`400`).

### `DELETE /api/v1/admin/categories/:id`
`409` if the category still has products or sub-categories. → `{ "data": { "id" } }`

---

## Products (Public)

### `GET /api/v1/products`
List **active** products in **active** categories.

| Query          | Type    | Default  | Notes                                                        |
| -------------- | ------- | -------- | ------------------------------------------------------------ |
| `q`            | string  | —        | Search name / description / brand / sku                      |
| `categoryId`   | string  | —        | Filter by category id                                        |
| `categorySlug` | string  | —        | Filter by category slug                                      |
| `brand`        | string  | —        | Exact brand (case-insensitive)                               |
| `minPrice`     | number  | —        |                                                              |
| `maxPrice`     | number  | —        |                                                              |
| `isFeatured`   | boolean | —        |                                                              |
| `inStock`      | boolean | —        | `true` → `stockQuantity > 0`                                 |
| `sort`         | enum    | `newest` | `newest·oldest·price_asc·price_desc·name_asc·name_desc`      |
| `page`         | number  | 1        |                                                              |
| `pageSize`     | number  | 20       | max 100                                                      |

List items include `category` (id/name/slug) and the cover image.

### `GET /api/v1/products/:slug`
Product detail by slug: all images (cover first), `specifications`, `category`, and up
to 8 `related` products from the same category. `404` if not found or inactive.

---

## Products (Admin) — `/api/v1/admin/products` 🔒 admin

All routes require an admin token. `GET /` and `GET /:id` return **all** products (any
status); `status` is filterable on the list.

### `POST /api/v1/admin/products` → `201`
```jsonc
{
  "name": "SS Ton Reserve Edition",   // required
  "sku": "SS-TON-001",                // required (unique)
  "categoryId": "cmr…",               // required
  "price": 8999.00,                   // required (>= 0)
  "brand": "SS",                      // optional
  "description": "…",                 // optional
  "discountPrice": 7499.00,           // optional (<= price, else 422)
  "stockQuantity": 12,                // optional (default 0)
  "lowStockThreshold": 3,             // optional (overrides store default)
  "specifications": {                  // optional key/value map (any keys)
    "Willow": "English", "Weight": "1180g"
  },
  "status": "ACTIVE",                 // optional: ACTIVE | INACTIVE
  "isFeatured": true,                 // optional
  "images": [                          // optional (max 20)
    { "url": "https://…/a.jpg" },
    { "url": "https://…/b.jpg", "isCover": true, "displayOrder": 1 }
  ]
}
```
Exactly one image is marked cover (first image defaults to cover if none set).
Duplicate `sku` → `409`.

### `GET /api/v1/admin/products/:id`
Full product detail by id. `404` if not found.

### `PATCH /api/v1/admin/products/:id`
Partial update. Providing `images` **replaces the entire image set**. `sku`/`categoryId`
changeable. `discountPrice > price` → `422`; duplicate `sku` → `409`.

### `DELETE /api/v1/admin/products/:id`
Deletes the product. Order history is preserved (order items keep a product snapshot).
→ `{ "data": { "id" } }`

---

## Planned Endpoints (not yet implemented)

- Real online-payment gateway (Razorpay/UPI) — order placement is LIVE
  (`POST /public/stores/:slug/orders`) with COD + dev-simulated online
  payment; production online payment stays 503 until the gateway lands
- `GET /api/v1/shipping/quote` — auto shipping calculation (orders currently
  ship free)
- `GET /api/v1/banners`, `GET /api/v1/store` — home page content
- `GET /api/v1/admin/dashboard` — admin metrics
- `POST /api/v1/auth/{web,mobile}/apple` — Apple Sign-In (same shape as Google)
- Payments (Razorpay/UPI); OAuth token verification for Google/Apple (email delivery
  via Resend and SMS OTP via Message Central are live with console fallbacks; Google
  sign-in stays 400 until a verifier is registered — see
  [`backend/docs/PACKAGE_AUTH.md`](../backend/docs/PACKAGE_AUTH.md))
