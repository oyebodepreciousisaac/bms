# BMS v0.1 — Staff Operations & Training Guide

This practical quick-reference guide is designed for the Bakery Owner, Sales Counter Staff, and Route Drivers transitioning from paper registers to **BMS v0.1**.

---

## 1. Access Roles & Logging In

The web app is installable as a Progressive Web App (PWA) on Android phones, iPhones, and desktop/laptop browsers.

| Role | Access URL | Credentials | Permitted Scopes |
| :--- | :--- | :--- | :--- |
| **Bakery Owner** | `/` (Dashboard) | `owner@bakery.com` (PIN: `1234`) | Full oversight, sales charts, staff logins, pricing, ingredients, Excel import/export. |
| **Sales Agent** | `/sales/new` | Phone number (e.g. `08012345678`) & 4-digit PIN | Touch POS counter, debtor receipts, finished goods stock. |
| **Route Driver** | `/distribution` | Phone number (e.g. `08034567890`) & 4-digit PIN | Route stock custody, delivery confirmations, unsold returns. |

---

## 2. Daily Counter Sales & Fast Bulk Orders

1. Open **Point of Sale (New Sale)** on mobile or desktop.
2. Select the customer:
   - For regular retail counter buyers, leave as **"Walk-in Customer"**.
   - For credit accounts, select **"Crown Stores"**, **"Big House"**, or search customer name.
3. Tap bread cards to add loaves.
   - **Out-of-Stock Protection:** Bread with 0 loaves cannot be ordered.
   - **Fast Bulk Ordering:** For large orders (e.g. `500 pcs`), tap directly into the quantity number box in the Order Register and type `500`. The system automatically caps at available inventory.
4. Choose payment channel: **Cash**, **Bank Transfer**, or **POS**.
   - Tap **"Full Paid"** if paid in full.
   - Tap **"Full Credit"** or enter a partial deposit (e.g. `₦40,000`). The remaining balance is automatically attached to the debtor account.
5. Tap **"Confirm Sale & Print"**.

---

## 3. Printing Invoices & Receipts

- **58mm / 80mm Bluetooth Mini-Printers:**
  - Select **"Print Bluetooth Slip"** for continuous roll printing.
  - Or tap **"Copy Text for Bluetooth App"** to paste formatted text directly into mobile ESC/POS print apps (*RawBT* or *Bluetooth POS Print*).
- **A4 Commercial Invoice:** Select **"Office A4 Invoice"** for formal distribution contracts with bank account details and signature authorization lines.

---

## 4. Debtor Balance Settlement (Golden Rule)

> [!IMPORTANT]
> **Never create a new dummy sale to record debt payments.**
> To record a repayment from Crown Stores, Big House, or any debtor:
> 1. Go to **"Sales & Debts"** ledger (`/sales`).
> 2. Filter by **"Debtors / Partial"**.
> 3. Click **"Settle"** on their original unpaid invoice.
> 4. Enter the amount paid and payment channel. The debt balance updates immediately.

---

## 5. Bakehouse Production & Inventory Logs

1. When morning or evening baking batches come out of the oven, go to **"Bakehouse Logs"** (`/production`).
2. Click **"Log Baked Batch"**.
3. Enter total loaves baked and damaged loaves (if any).
4. Net usable loaves immediately increase finished goods stock.

---

## 6. Raw Materials & Ingredient Tracking

1. Go to **"Raw Materials"** (`/raw-materials`).
2. When supplier trucks deliver flour sacks or sugar bags, click **"+ Receive Stock"**.
3. When flour is taken into the bakery for mixing, click **"- Record Usage / Waste"**.
4. The system warns the owner whenever stock falls below safety reorder levels.

---

## 7. Distributor Dispatch & Shift Reconciliation

1. **Morning Dispatch:** Owner clicks **"+ New Dispatch Allocation"** on `/distribution` and assigns loaves to driver custody (e.g. Sunday Okafor). Loaves are deducted from the bakery store.
2. **Evening Shift Reconciliation:** 
   - Driver returns to the bakery.
   - Click **"Reconcile Shift"**.
   - Enter actual loaves **Sold / Delivered** and unsold loaves **Returned**.
   - Any discrepancy is flagged immediately.
   - Unsold loaves are returned back into bakery inventory automatically.

---

## 8. Clean Slate for Live Client Handover

Before delivering to the client:
1. Log in as the Owner.
2. Go to **"Staff & Access"** (`/staff`).
3. Click **"Clean Slate (New Product)"** to clear demo transactions and start with **₦0** sales and fresh customer balances, while keeping bread types and worker logins intact.
4. You can click **"Reload Demo Cases"** at any time to restore realistic test data for reviews.

