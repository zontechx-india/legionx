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
| 500    | Server error                                                |

**Auth:** Bearer JWT. Two token kinds, distinguished by a `type` claim:
- **Admin** token → required for all `/api/v1/admin/**` resource routes (except
  `/admin/auth/login`). Obtained via admin login.
- **Customer** token → required for `/api/v1/auth/me*`. Obtained via phone OTP.

Send it as `Authorization: Bearer <token>`. A customer token on an admin route (or
vice-versa) returns `403`. Missing/invalid/expired tokens return `401`. Public
browse/checkout endpoints need no token and only ever return active data.

---

## Health

### `GET /health`
Liveness/readiness probe (no `/api/v1` prefix). Not wrapped in the envelope.
```json
{ "status": "ok", "uptime": 12.34, "timestamp": "2026-07-13T02:22:07.318Z" }
```

---

## Customer Auth (`/api/v1/auth`)

Customers browse and check out as **guests**. Logging in (needed only to view their own
profile/orders) is by **OTP to either an email address or a mobile number**. Every
request carries **exactly one** identifier — `email` **or** `phone` (both / neither →
`422`). Each email and phone maps to exactly one account.

### `POST /api/v1/auth/otp/request` → `201`
```jsonc
{ "email": "ravi@example.com" }   // OR: { "phone": "9876543210" }
```
Generates a one-time code and "sends" it via the email/SMS provider (chosen from the
identifier). No real gateway yet, so in **non-production** the response includes `devCode`:
```jsonc
{ "success": true, "data": { "channel": "EMAIL", "destination": "ravi@example.com",
                             "expiresInMinutes": 5, "devCode": "670467" } }
```

### `POST /api/v1/auth/otp/verify`
```jsonc
{ "email": "ravi@example.com", "code": "670467" }   // OR phone + code
```
Verifies the code, creates the customer on first login (identifier marked verified),
returns a **customer token**. Logging in later with a *linked* identifier resolves to the
same account.
```jsonc
{ "success": true, "data": { "token": "…",
    "customer": { id, email, phone, emailVerifiedAt, phoneVerifiedAt, name, altPhone, createdAt } } }
```
`401` on wrong/expired code or after `OTP_MAX_ATTEMPTS` failures.

### `GET /api/v1/auth/me` 🔒 customer
The logged-in customer's profile.

### `PATCH /api/v1/auth/me` 🔒 customer
```jsonc
{ "name": "Ravi", "altPhone": "9123456780" }   // both optional
```
Only `name` / `altPhone` are editable here. Email and phone are **login identifiers** and
can only be changed via the verified linking flow below.

### `GET /api/v1/auth/me/orders` 🔒 customer
The customer's own orders (most recent first), each with its line items.

### Account linking 🔒 customer
Add the *other* identifier to your account, verified by a second OTP.

**`POST /api/v1/auth/me/link/request`** → `201`
```jsonc
{ "phone": "9876500011" }   // OR { "email": "…" } — the identifier you don't have yet
```
`409` if that email/phone is already linked to another account (or already on yours).
Sends an OTP to the new identifier.

**`POST /api/v1/auth/me/link/verify`**
```jsonc
{ "phone": "9876500011", "code": "531542" }
```
On success the identifier is set + marked verified on your account. `409` if it was
claimed by another account in the meantime.

---

## Admin Auth (`/api/v1/admin/auth`)

### `POST /api/v1/admin/auth/login`
```jsonc
{ "email": "admin@store.com", "password": "…" }
```
→ `{ "success": true, "data": { "token": "…", "admin": { id, email, name, role, … } } }`.
`401` on bad credentials (same message whether email or password is wrong).

### `GET /api/v1/admin/auth/me` 🔒 admin
The logged-in admin's profile.

> **Bootstrap the first admin** (no signup endpoint by design):
> `npm run create-admin -- <email> <password> ["Full Name"]`

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

- `POST /api/v1/orders` — guest/customer checkout (creates the order for the logged-in
  or guest customer); `GET /api/v1/auth/me/orders` already lists a customer's history
- `GET /api/v1/shipping/quote` — auto shipping calculation
- `GET /api/v1/banners`, `GET /api/v1/store` — home page content
- `GET /api/v1/admin/dashboard` — admin metrics
- Image upload (S3), payments (Razorpay/UPI), real SMS gateway for OTP
