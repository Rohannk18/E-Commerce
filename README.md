# CommerceFlow – Full-Stack E-commerce Platform

CommerceFlow is an end-to-end, production-ready full-stack e-commerce platform built with modern web standards, role-based access control, atomic database transactions, inventory concurrency handling, simulated sandbox payments, and an admin management dashboard with state-machine order workflows.

---

## 🌟 Key Portfolio Differentiators

1. **Atomic Checkout Transactions**
   - All checkout steps (cart verification, payment processing, stock decrement, order creation, order snapshot item insertion, and cart clearing) execute inside an atomic database transaction.
   - If payment fails or stock is exhausted, the entire transaction rolls back cleanly with zero inventory loss.

2. **Inventory Concurrency & Overselling Prevention**
   - Stock limits are strictly checked both in the UI and atomically decremented in the database.
   - Dynamic boundary checks prevent users from ordering more items than are physically available in inventory.

3. **Strict Order Status State Machine**
   - Order status transitions strictly enforce the legitimate lifecycle:
     $$\text{PENDING} \longrightarrow \text{CONFIRMED} \longrightarrow \text{PROCESSING} \longrightarrow \text{SHIPPED} \longrightarrow \text{DELIVERED}$$
   - Any order cancellation before delivery automatically restores reserved inventory units to the product catalog and creates an inventory audit log.
   - Illegal state jumps (e.g. `DELIVERED` $\rightarrow$ `PENDING`) are blocked with HTTP 400.

4. **Inventory Audit Logs**
   - Every stock modification—whether from customer checkout, order cancellation, or manual admin restock—is logged with timestamps, previous stock, new stock, difference, and reason.

5. **Role-Based Access Control (RBAC)**
   - Secure JWT tokens stored in HTTP-only cookies and Authorization headers.
   - `CUSTOMER` and `ADMIN` roles with route protection middleware blocking unauthorized access to `/api/admin/*`.

---

## 🛠️ Technology Stack

- **Frontend (`apps/web`)**:
  - React 18, TypeScript, Vite
  - Tailwind CSS, Lucide Icons, Canvas Confetti
  - React Router 6, Axios API Client
  - Context API for Authentication & Cart management

- **Backend (`apps/api`)**:
  - Node.js, Express.js, TypeScript
  - Prisma ORM (SQLite / PostgreSQL compatible)
  - JWT Authentication, Bcrypt Password Hashing, Cookie Parser

- **Shared Package (`packages/shared`)**:
  - Shared TypeScript interfaces, DTOs, Enums, and State Machine transition validators

---

## 🚀 Quick Start & Running Locally

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Install Dependencies
From the project root:
```bash
npm install
```

### 3. Setup Database & Seed Demo Data
```bash
# Push database schema
npm run db:push

# Seed categories, 12+ tech products, users, and demo orders
npm run db:seed
```

### 4. Start Development Servers
You can start both backend and frontend concurrently:
```bash
# Terminal 1: Start Backend API (Port 5000)
npm run dev:api

# Terminal 2: Start Frontend Web (Port 5173)
npm run dev:web
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Demo Accounts & Sandbox Test Data

CommerceFlow includes a **Demo Fast-Login Bar** at the top of the app for 1-click testing:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@commerceflow.com` | `Admin123!` | Executive Dashboard, Inventory Monitor, State Machine Orders, Product CRUD, Customer GMV |
| **Customer** | `customer@commerceflow.com` | `Password123!` | Product Catalog, Cart, 3-Step Checkout, Live Tracking Timeline, Order History |

### Simulated Payment Presets

- **Fake Credit Card**:
  - **Success Card**: `4242 4242 4242 4242` | Expiry: `12/28` | CVV: `123`
  - **Decline / Failure Card**: `4000 0000 0000 0000` | Expiry: `12/28` | CVV: `000`
- **UPI Simulation**:
  - **Success UPI**: `user@okaxis`
  - **Failure UPI**: `fail@upi`
- **Cash on Delivery (COD)**:
  - Automatically places order with `PENDING` payment status, updated to `PAID` upon delivery.

---

## 📡 API Specification

### Authentication
- `POST /api/auth/register` – Register new customer or admin account
- `POST /api/auth/login` – Authenticate with email/password and receive JWT
- `POST /api/auth/logout` – Clear session cookie
- `GET /api/auth/me` – Retrieve current authenticated user profile

### Products & Categories
- `GET /api/products` – List products with search (`q`), category (`categoryId`), price range, stock filter, sorting, and pagination
- `GET /api/products/:id` – Detailed product view with multi-image gallery
- `POST /api/products` *(Admin)* – Create product with SKU uniqueness and initial stock log
- `PUT /api/products/:id` *(Admin)* – Update product details, pricing, and stock
- `DELETE /api/products/:id` *(Admin)* – Soft-delete / deactivate product
- `GET /api/categories` – List categories with product counts

### Shopping Cart
- `GET /api/cart` – View user's cart with live stock check, subtotal, and delivery fees
- `POST /api/cart/items` – Add item to cart (validates quantity $\le$ stock)
- `PUT /api/cart/items/:id` – Update quantity (enforces stock limits)
- `DELETE /api/cart/items/:id` – Remove item from cart
- `DELETE /api/cart` – Clear all cart items

### Checkout & Orders
- `POST /api/orders/checkout` – Execute atomic transaction checkout with simulated payment
- `GET /api/orders` – Customer order history
- `GET /api/orders/:id` – Order details with tracking timeline
- `PUT /api/orders/:id/cancel` – Cancel order and restore inventory

### Admin Operations *(Protected by RBAC)*
- `GET /api/admin/dashboard` – Executive KPIs, category revenue distribution, recent orders
- `GET /api/admin/orders` – Paginated customer orders with status filter & search
- `PUT /api/admin/orders/:id/status` – Advance order through State Machine
- `GET /api/admin/inventory` – Inventory monitor with low-stock warnings ($\le 5$ units)
- `PUT /api/admin/inventory/:productId` – Adjust stock with audit reason logging
- `GET /api/admin/inventory/logs` – View full audit log history
- `GET /api/admin/customers` – Customer directory with GMV metrics

---

## 🧪 Automated Verification Suite

Run the automated backend test suite:
```bash
npx tsx scripts/verify-backend.ts
```

This verifies:
1. Health check endpoint
2. Product search and price/category filtering
3. Authentication and RBAC 403 Forbidden enforcement
4. Cart operations and stock boundary rejection ($> \text{stock}$)
5. Atomic checkout with stock decrement and transaction rollback on payment failure
6. State machine valid order transitions & rejection of invalid state jumps
7. Inventory audit logs and manual stock adjustments with reason logging

---

## 📄 License
This project is licensed under the MIT License.