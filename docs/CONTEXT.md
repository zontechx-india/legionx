# White Label E-Commerce Platform
> Version 1.0

## Overview

A lightweight, white-label e-commerce platform designed for small and medium businesses. The platform should support different business types (sports, electronics, clothing, grocery, etc.) without requiring code changes. Each business can manage its own products, categories, inventory, and customer orders.

The first implementation will be for a **Cricket Bat Store**, but the architecture should support any product category in the future.

---

# Objectives

- White-label architecture
- Easy product management
- Simple ordering process
- Mobile-friendly website
- Low maintenance
- Easily scalable

---

# User Roles

## Customer
- Browse products
- Search products
- View product details
- Place orders
- Track orders
- View previous orders

## Admin
- Manage products
- Manage categories
- Manage inventory
- Manage orders
- Manage shipping charges
- Manage banners
- View dashboard

---

# Website Pages

## Home
- Banner Carousel
- Featured Products
- Categories
- New Arrivals
- Best Selling Products
- About Business
- Contact Information

---

## Category Listing
- Product Grid
- Search
- Filters
- Sorting

---

## Product Details

Display:

- Product Images
- Product Name
- Description
- Category
- Price
- Available Stock
- Product Specifications
- Related Products

Actions

- Buy Now
- Add to Cart

---

## Shopping Cart

- Product List
- Quantity Update
- Remove Product
- Shipping Charge
- Total Amount

---

## Checkout

Customer Information

- Full Name
- Mobile Number
- OTP Verification
- Alternative Mobile Number
- Address
- District
- State
- Pincode

Order Summary

- Products
- Quantity
- Shipping Charge
- Total Amount

---

## Order Success

- Order ID
- Confirmation Message
- Estimated Delivery
- Track Order Button

---

## Order History

Access using

- Mobile Number
- OTP Verification

Customer can view

- Previous Orders
- Order Details
- Order Status

---

# Product Management

Admin can

- Add Product
- Edit Product
- Delete Product
- Enable/Disable Product

Each Product contains

- Product Name
- SKU
- Category
- Brand
- Description
- Price
- Discount Price
- Stock Quantity
- Multiple Images
- Specifications
- Status

---

# Category Management

Admin can

- Add Category
- Edit Category
- Delete Category
- Change Display Order

Example

Sports
- Cricket Bat
- Cricket Ball

Electronics
- Mobile
- Laptop

Clothing
- Shirts
- Shoes

Future categories can be added without development.

---

# Inventory Management

- Stock Quantity
- Low Stock Alert
- In Stock
- Out of Stock

---

# Image Management

- Upload Multiple Images
- Change Cover Image
- Delete Images

---

# Order Management

Admin can

- View Orders
- Search Orders
- Update Order Status
- Cancel Orders
- View Customer Details

Order Status

- Pending
- Confirmed
- Packed
- Shipped
- Delivered
- Cancelled

---

# Shipping Management

Shipping charge should be configurable.

Support

- Fixed Shipping
- District-wise Shipping
- State-wise Shipping
- Free Shipping (optional)

The shipping amount is calculated automatically during checkout.

---

# OTP Verification

OTP verification required for

- Placing Order
- Viewing Order History

Customer account creation is **not mandatory**.

---

# Search

- Product Search
- Category Search

---

# Admin Dashboard

Display

- Total Products
- Total Categories
- Total Orders
- Pending Orders
- Delivered Orders
- Revenue
- Low Stock Products

---

# Notifications (Future)

- Order Confirmation SMS
- Order Shipped SMS
- WhatsApp Updates
- Email Notifications

---

# Payment

Phase 1

- Cash on Delivery

Phase 2

- UPI
- Razorpay
- Credit/Debit Cards
- Net Banking

---

# Future Enhancements

- Coupons
- Wishlist
- Product Reviews
- Product Ratings
- Recently Viewed Products
- Multiple Admins
- Multiple Vendors
- Delivery Partner Integration
- Invoice Download (PDF)
- Analytics Dashboard
- GST Support

---

# Non-Functional Requirements

- Responsive Website
- Fast Loading
- SEO Friendly
- Secure APIs
- Image Optimization
- Cloud Storage
- Backup & Recovery

---

# Suggested Technology Stack

## Frontend
- React
- Tailwind CSS

## Backend
- Node.js

## Database
- PostgreSQL

## File Storage
- AWS S3

## Authentication
- OTP (SMS)

## Hosting
- AWS / DigitalOcean / VPS

---

# Phase 1 Deliverables

- White-label website
- Product management
- Category management
- Inventory management
- Shopping cart
- Guest checkout with OTP
- Dynamic shipping charges
- Order management
- Order history
- Responsive design

---

# Initial Business Configuration

Business Type
- Cricket Equipment

Categories

- Hard Tennis Bats
- Soft Tennis Bats

Products

- Multiple bat models under each category

The system should allow adding completely new categories and products in the future without requiring application changes.