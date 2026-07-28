# MVP Home Page Specification
> White-Label E-Commerce Platform
>
> Version: MVP 1.0

---

# Overview

The platform homepage (`/`) is the entry point for customers visiting the marketplace.

Unlike individual stores (`/store/{storeSlug}`), the homepage is **not a shopping page**. Its purpose is to help users discover stores, search products, and encourage new sellers to create their own stores.

The homepage should remain lightweight and avoid features that require large amounts of user activity (Trending, Best Sellers, Ratings, Deals, etc.).

The dedicated store page will continue to be the primary shopping experience.

---

# Goals

- Help customers quickly find stores
- Allow searching across the entire platform
- Showcase newly created stores
- Let returning customers continue browsing
- Give store owners quick access to their stores
- Encourage visitors to become sellers
- Keep the homepage simple and fast

---

# Page Structure

```
------------------------------------------------

Header

Hero Search

Recent Searches (Optional)

New Stores

Recently Viewed Stores (Conditional)

My Stores (Conditional)

Become a Seller

Platform Statistics

Footer

------------------------------------------------
```

---

# 1. Hero Search

## Purpose

The Hero Search is the primary action on the homepage.

Users should be able to search globally across the entire platform.

Search should support

- Stores
- Products
- Categories

The search input should contain placeholder text similar to

```
Search stores, products, or categories...
```

---

## Search Behaviour

Search should begin after the user enters 2-3 characters.

The API should return grouped results.

Example

```
Search

cricket
```

Results

```
Stores

Power Sports

Cricket World

--------------------

Categories

Cricket

Accessories

--------------------

Products

MRF Genius Bat

SS Master Bat

Kookaburra Pro
```

---

## Navigation

### Store Result

Navigate to

```
/store/{storeSlug}
```

---

### Category Result

Navigate to

```
/category/{categorySlug}
```

(or the future category listing page)

---

### Product Result

Navigate to

```
/store/{storeSlug}/product/{productSlug}
```

---

## Empty State

If no results are found

```
No matching stores, products or categories found.
```

---

# 2. Recent Searches (Optional)

## Purpose

Help users quickly search again.

No backend required.

Store locally using browser LocalStorage.

---

## Behaviour

Store the last

- 5
- or 10

searches.

Example

```
Recent Searches

Cricket Bat

Helmet

MRF

Sports
```

---

Hide this section if there are no recent searches.

---

# 3. New Stores

## Purpose

Show recently published stores.

Since the platform is new, this replaces Trending Stores.

---

## Data

Show newest published stores first.

Example

```
Logo

Power Sports

/store/power-sports

Visit Store →
```

---

## Card Information

Display

- Logo
- Store Name
- Public URL (optional)
- Visit Store button

---

## Empty State

```
No stores have been published yet.

Be the first seller!

Create Store →
```

---

# 4. Recently Viewed Stores

## Purpose

Allow users to continue shopping.

---

## Behaviour

Whenever a customer opens

```
/store/{slug}
```

save the store locally.

Store

- Store Name
- Logo
- Store Slug

No backend required.

---

## Display

```
Recently Viewed

Power Sports

Apple Hub

Bike Garage
```

---

Clicking a card opens

```
/store/{slug}
```

---

Hide this section if empty.

---

# 5. My Stores

## Purpose

Quick access for store owners.

---

## Visibility

Only show when

Customer owns at least one store.

Otherwise hide completely.

---

## Example

```
My Stores

Power Sports

Published

Manage Store

--------------------------------

Bike Garage

Draft

Manage Store

--------------------------------

+ Create New Store
```

---

Clicking

Manage Store

opens

```
/stores/{storeSlug}
```

---

# 6. Become a Seller

## Purpose

Encourage marketplace growth.

This should be one of the largest homepage sections.

---

## Example

```
Start Selling Online

Create your own professional online store in minutes.

No technical knowledge required.

[ Create Store ]
```

---

If the customer already owns stores

Button changes to

```
Create Another Store
```

---

# 7. Platform Statistics

## Purpose

Build trust.

Display only values available.

Initially

```
Stores

Products
```

Later

```
Stores

Products

Orders
```

---

Example

```
18

Stores

----------------

642

Products

----------------

1,245

Orders
```

If Orders are not available yet

Only display

```
18 Stores

642 Products
```

---

# 8. Footer

Display

```
About

Privacy Policy

Terms & Conditions

Support

Contact

Become a Seller
```

---

## Navigation

Until pages are implemented

Display a simple

```
Coming Soon
```

page instead of returning 404.

---

# Search Requirements

Search should support

✅ Store Name

✅ Product Name

✅ Category Name

---

Search results should always be grouped.

Never mix all result types together.

Correct

```
Stores

...

Products

...

Categories

...
```

Incorrect

```
Store

Product

Category

Product

Store

Category
```

---

# Responsive Behaviour

## Desktop

Hero search centered.

Sections displayed in rows.

Store cards shown in multiple columns.

---

## Tablet

Reduce card width.

Keep search full width.

---

## Mobile

Single column layout.

Horizontal scrolling allowed for

- New Stores
- Recently Viewed
- My Stores

Large touch-friendly buttons.

---

# Loading States

Each section should display skeleton loaders while data is loading.

Examples

- Store cards
- Statistics
- My Stores

---

# Error Handling

If API fails

Display

```
Something went wrong.

Please try again.
```

Provide Retry button.

---

# Performance

Load homepage sections independently.

Failure of one section should not stop others from loading.

Example

Hero Search

↓

New Stores

↓

My Stores

↓

Platform Statistics

Each API should be independent.

---

# Future Features (Not Part of MVP)

Do NOT implement these features now.

- Trending Stores
- Featured Stores
- Top Rated Stores
- Popular Products
- Deals & Offers
- Nearby Stores
- AI Recommendations
- Featured Brands
- Customer Reviews
- Follow Stores
- Store Stories
- Personalized Recommendations

These will be added after the platform has sufficient customer and order data.

---

# Final Homepage Flow

```
Customer opens Homepage

        │
        ▼

Hero Search

        │
        ▼

Recent Searches (Optional)

        │
        ▼

New Stores

        │
        ▼

Recently Viewed Stores (If Available)

        │
        ▼

My Stores (If Store Owner)

        │
        ▼

Become a Seller

        │
        ▼

Platform Statistics

        │
        ▼

Footer
```

---

# Success Criteria

The homepage should

- Be simple and clean
- Load quickly
- Help users discover stores
- Support global search
- Encourage seller registrations
- Provide quick access for existing store owners
- Scale naturally as the marketplace grows
- Avoid placeholder features that require future analytics or customer activity