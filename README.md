# Bakery Management System (BMS v0.1)

> **Enterprise-grade, offline-first Progressive Web App (PWA) engineered for high-volume commercial bakeries.**  
> Built to eliminate cash leakage, unrecorded distributor credit, stock shrinkage, and manual paper registers.

[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-f39c12?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

---

## 📋 Executive Overview

BMS v0.1 digitizes counter operations, production shifts, raw ingredient inventory, and route distribution for commercial bakeries. It was engineered specifically to solve the high-stress, low-connectivity operational challenges of busy bakeries:

- **Touch-First Point of Sale (POS):** Fast counter checkout with numeric quantity keying (up to 500+ units) and physical out-of-stock clamping.
- **Offline Resilience:** Cashiers and dispatch drivers continue recording sales and drop-offs during power cuts or internet outages. Data queues in IndexedDB and automatically synchronizes via Supabase upon reconnection.
- **Distributor Custody & Route Accounting:** Tracks crated loaves assigned to van and motorbike drivers, returns, damages, and cash remittances per dispatch run.
- **Customer & Debtor Ledgers:** Complete history of credit sales, partial cash/transfer payments, outstanding balances, and debtor statements.
- **Thermal & A4 Invoices:** One-click receipt generation formatted for standard 58mm/80mm Bluetooth ESC/POS thermal printers and office A4 printers.
- **Bakehouse & Raw Materials Tracking:** Shift-by-shift flour flour bag usage, dough yields, baked quantities, and damaged batch reconciliation.
- **Bi-Directional Excel Master Workbook:** 6-sheet export and structured spreadsheet import for off-system audit and accountant reviews.
- **Zero-Trust Security & Role Separation:** Hashed PINs (salted SHA-256) and Role-Based Access Control (RBAC) preventing unauthorized ledger modifications.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer (PWA)                     │
│  React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
      (Online Mode: Realtime)        (Offline Fallback)
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│     Supabase Cloud API       │ │    Local IndexedDB Cache    │
│  - PostgreSQL 15 Engine      │ │  - Offline Mutation Queue   │
│  - Row-Level Security (RLS)  │ │  - Salted PBKDF2/SHA-256    │
│  - Realtime Change Subscriptions│  Credentials Storage       │
└──────────────┬───────────────┘ └─────────────┬───────────────┘
               │                               │
               └────────► Sync Engine ◄────────┘
                   - Deterministic UUIDs
                   - Idempotent Upsert Logic
                   - Conflict Resolution (Client-Timestamped)
```

---

## 🚀 Key Modules & Capabilities

### 1. Point of Sale (POS) & Counter Register
- Single-tap catalog selection filtered by category (`Bread`, `Pastries`, `Specialty`, `Healthy`).
- Direct quantity typing for large wholesale distributor dispatches (e.g. `200` or `500` loaves).
- Automatic inventory threshold check prevents sales of out-of-stock items.
- Split payment channels: **Cash**, **Bank Transfer**, and **Card POS**.
- Partial payments automatically log unpaid balances directly into customer debtor ledgers.

### 2. Debtor & Credit Tracking
- Instant visibility into total bakery receivables.
- Customer-specific ledgers with full transaction audit logs.
- Partial debt payment modal recording receipt notes and updating real-time balances.
- Debtor statements downloadable or printable on Bluetooth thermal rolls.

### 3. Bakehouse & Production Logging
- Shift logging (`Morning`, `Afternoon`, `Night`) tracking planned vs actual output.
- Automatic calculation of damaged loaves and baker efficiency.
- Reconciles baked batches directly into finished goods sellable stock.

### 4. Raw Materials & Stock Movements
- Real-time balances of flour, sugar, yeast, butter, and packaging bags.
- Restock and write-off logging with supplier names and costs.
- Prevents unaccounted stock shrinkage between warehouse and mixing floor.

### 5. Route Distributor Logistics
- Assign crate batches to designated route drivers (`Motorbike Route 1`, `Main Van Express`).
- Records delivered quantities, unsold returns, damaged goods, and cash remitted.
- Route reconciliation ledger balances crate custody before dispatching subsequent batches.

### 6. Interactive Executive Financial Charts
- Pure SVG interactive financial trajectory line chart (responsive across mobile & desktop).
- Dynamic timeframe filters (`1W`, `2W`, `1M`) calculated from verified transactional ledger data.
- Milestone markers, trend badges, and minimum/maximum revenue benchmarks.

### 7. Dual Hardware Receipt & Invoice Formats
- **58mm / 80mm ESC/POS Thermal:** Optimized for portable Bluetooth printers used by counter cashiers and delivery vans.
- **A4 Formal Tax Invoice:** For institutional buyers (supermarkets, schools, corporate hotels).

---

## 🔒 Security & Data Integrity

- **Cryptographic PIN Protection:** Staff credentials and 4-digit POS PINs are hashed using the browser's native **Web Crypto API** (`SHA-256` with high-entropy project salts). Plaintext PINs are never stored in `localStorage` or transmitted unencrypted.
- **Role-Based Access Control (RBAC):**
  - `OWNER (ADMIN)`: Unrestricted access to profit margins, staff management, raw materials, Excel imports, and system resets.
  - `SALES COUNTER`: Locked to POS sales, receipt printing, and customer balance collection.
  - `ROUTE DRIVER`: Restricted view displaying only assigned deliveries and customer drop-offs.
- **PostgreSQL Row Level Security (RLS):** Supabase database tables enforce strict tenant and role policies at the SQL engine level.

---

## 📦 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 18** | High-performance component-driven user interface |
| **TypeScript** | Strict compile-time type safety across all domain entities |
| **Vite** | Blazing fast build tooling and Hot Module Replacement (HMR) |
| **Tailwind CSS** | Utility-first, mobile-responsive design system |
| **Supabase** | Cloud PostgreSQL, Auth, and Row-Level Security |
| **IndexedDB (idb)** | Client-side persistent offline database |
| **Vite PWA** | Service Worker registration, manifest, and offline caching |
| **XLSX (SheetJS)** | Multi-sheet commercial Excel export and parsing |
| **Lucide React** | Production icon set |

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/oyebodepreciousisaac/bms.git
   cd bms
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Launch Local Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Production Build:**
   ```bash
   npm run build
   ```
   The production-optimized bundle and service workers will be compiled to `dist/`.

---

## ☁️ Deployment Guide

### Deploying to Vercel (Recommended)

1. Push your code to GitHub:
   ```bash
   git push -u origin main
   ```
2. Import the repository in [Vercel Dashboard](https://vercel.com/new).
3. The included `vercel.json` automatically configures Single-Page Application (SPA) rewrites and PWA cache-control headers:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
4. Set the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Vercel Project Settings.
5. Click **Deploy**.

---

## 📖 Database Schema & Migrations

The complete PostgreSQL migration script with Row-Level Security policies is located at:
[`supabase/migrations/20261029000000_bms_schema_and_rls.sql`](supabase/migrations/20261029000000_bms_schema_and_rls.sql)

### Included Tables:
- `products` (Sellable bakery inventory & price thresholds)
- `customers` (Retail and wholesale debtors)
- `sales` & `sale_items` (Transaction ledger & audit trail)
- `raw_materials` & `material_logs` (Ingredient stock cards)
- `bakehouse_logs` (Shift production runs & waste tracking)
- `distributions` & `distribution_items` (Route dispatches)
- `debt_payments` (Receivable recovery ledger)

---

## 👥 Staff Onboarding

Refer to [`docs/staff-training-guide.md`](docs/staff-training-guide.md) for operational instructions tailored for counter cashiers, head bakers, and route delivery personnel.

---

## 📄 License

Proprietary. Developed for commercial bakery deployment. All rights reserved.
