# BMS MVP Specification (Bakery Management System)

**Project State:** VALIDATION & PROTOTYPE PLANNING  
**Primary Source of Truth:** `docs/bms-playbook.pdf` (Client-aligned MVP Specification)  
**Methodology:** Oyebode Solution Builder (`.agents/skills/oyebode-builder`)  

---

## 1. Project Understanding & Problem Framing

### The Real Problem
The client currently runs daily bakery operations on paper records. This manual process causes:
- Discrepancies between sales recorded and physical cash/transfer received.
- Unclear customer debt balances (partial payments and overdue credit).
- Unknown finished-goods stock vs. wastage/damages.
- Inaccurate raw-material stock tracking and unaccounted wastage.
- Unreconciled distributor allocations (distributor handovers mistaken for sales or unaccounted for).
- Time-consuming end-of-day reconciliation for the owner.

### Core Value Hypothesis
**FOR** the bakery owner, sales agents, and distributors  
**WHO** suffer from paperwork errors, lost revenue, debt confusion, and stock discrepancies  
**THE BMS WEB APP** replaces paper registers with an offline-capable, responsive digital register and real-time operational dashboard  
**BY** capturing sales, partial payments, production batches, raw material movements, and distributor handovers with instant local validation and queued cloud synchronization  
**SO THAT** the owner gains exact visibility into daily sales, customer balances, finished stock, ingredient levels, and distributor reconciliations without operational friction or complex ERP overhead.

---

## 2. Target Users & Device Context

| Role | Primary Device | Key Objectives & Workflow Context |
| :--- | :--- | :--- |
| **Bakery Owner** | Laptop / Desktop | Full oversight: sales totals, cash collected, debts owed, stock levels, production records, distributor reconciliation, staff accounts, price management, Excel export/import, and receipt printing. |
| **Sales Agent** | Mobile Phone | Rapid sale recording (walk-in or customer), capturing partial/full payments (cash/transfer/POS), generating 58/80mm receipts, and offline recording during connectivity drops. |
| **Distributor** | Mobile Phone | Acknowledging assigned bread/pastries, logging deliveries/sales to retail spots, reporting returns, and tracking settled vs. owed collections. |

---

## 3. Confirmed MVP Scope & Feature Matrix

### In-Scope Modules

1. **Authentication & Role-Based Access Control (RBAC):**
   - Three discrete roles: `owner`, `salesperson`, `distributor`.
   - Row-level and route-level protection (Owner manages staff; staff only access their permitted scopes).

2. **Product & Pricing Management:**
   - Owner creates, updates, and archives bakery items and categories (e.g., Family Loaf, Sardine Bread, Pastries).
   - Dynamic unit prices, active status toggle; zero hardcoded product catalogs.

3. **Sales & Debt Tracking (Partial Payments):**
   - Fast item selection with automatic subtotal, discount/tax (if applicable), and total calculation.
   - Payment recording: Full payment, partial payment, or credit.
   - Payment method tag: Cash, Bank Transfer, or POS (entered manually; no external payment gateway).
   - Debt repayment workflow: Additional payments attach directly to existing sales transactions (never create dummy sales to record balance settlements).
   - Single-decrement stock rule: Inventory is decremented exactly once upon sale confirmation.

4. **Customer Register & Credit Accounts:**
   - Customer directory with contact details and running debt balance.
   - Default "Walk-in Customer" option for anonymous counter sales.
   - Customer purchase & payment ledger.

5. **Production & Finished Goods Stock:**
   - Production logging: Units produced and units damaged/defective per batch.
   - Usable net units immediately increment finished goods inventory.
   - Physical inventory adjustments with audit trail.

6. **Raw Materials & Ingredient Tracking:**
   - Record ingredient receipts (e.g., 50kg Flour sacks, Sugar, Yeast, Butter, Margarine).
   - Record ingredient usage and recorded wastage.
   - Real-time stock balance ledger.
   - *Explicit Rule:* Manual usage logging only; no automated recipe deduction in this MVP.

7. **Distributor Allocation & Reconciliation:**
   - Owner assigns batches of finished goods to distributors.
   - Separate allocation ledger: Transfer does **NOT** equal revenue or sale.
   - Distributor acknowledges receipt, logs deliveries/sales, and logs returned unsold items.
   - Automatic reconciliation calculation: `Allocated = Sold + Returned + Pending`.

8. **Receipts & Invoicing:**
   - Clean printable receipt layout with business branding, items, quantities, total, amount paid, and outstanding balance.
   - Support for standard browser printing, PDF download, and thermal receipt formats (58mm and 80mm).
   - Direct Bluetooth printing reserved for physical hardware verification.

9. **Owner Operational Dashboard:**
   - High-level KPI cards: Today's Gross Sales, Cash Collected, Receivables (Unpaid Debts), Available Finished Stock, Low Ingredient Warnings.
   - Filterable daily/weekly/monthly date ranges.
   - Recent transaction audit trail.

10. **Excel Import & Export:**
    - Export clean `.xlsx` workbooks for Sales, Payments, Customers, Inventory, and Production.
    - Controlled `.xlsx` template import for initial product setup, customer lists, and opening balances with strict validation and preview error report.

11. **Offline-First PWA & Sync Queue:**
    - Installable Progressive Web App (PWA) with Service Worker asset caching.
    - IndexedDB (via Dexie.js) local transaction queue.
    - Explicit sync statuses: `Saved locally`, `Pending`, `Synced`, `Failed / Needs review`.
    - Idempotent UUID-based synchronization on network recovery.

---

## 4. Explicit Exclusions (Out of Scope for MVP)

As agreed in the BMS Playbook:
- **No Public E-commerce or Storefront:** No public ordering, checkout, or cart.
- **No Online Payment Gateway:** No Paystack/Flutterwave/Stripe integrations (payments are collected as physical cash, bank transfer, or manual POS).
- **No Automatic Recipe Deduction Engine:** Ingredients are logged manually, not auto-deducted per baked loaf.
- **No Live Multi-Agent Inventory Locking:** Disconnected agents cannot see live concurrent deductions; overselling is flagged for owner reconciliation rather than silently failing.
- **No GPS Fleet Tracking or Live Driver Routing.**
- **No Automated WhatsApp API Messaging or SMS Gateways.**
- **No Payroll, Multi-Branch, or Complex Multi-Entity Accounting.**
- **No Live Google Sheets Two-Way Sync:** (Excel import/export serves this reporting need).
- **No AI / LLM features:** All workflows are deterministic business rules.

