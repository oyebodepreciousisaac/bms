-- ==============================================================================
-- BAKERY MANAGEMENT SYSTEM (BMS) - SCHEMA & ROW LEVEL SECURITY (RLS)
-- Version: v0.1
-- Standard: PostgreSQL 15+ / Supabase Auth & Storage
-- ==============================================================================

-- 1. EXTENSIONS & CUSTOM ENUM TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'salesperson', 'distributor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('paid', 'partial', 'credit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'pos');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE allocation_status AS ENUM ('assigned', 'acknowledged', 'reconciled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE raw_material_movement_type AS ENUM ('receipt', 'usage', 'waste');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. USER PROFILES & SECURITY ROLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'salesperson',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 3. PRODUCT CATALOG & FINISHED STOCK
-- ==============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    min_stock_alert INT NOT NULL DEFAULT 20,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS finished_stock (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    current_stock INT NOT NULL DEFAULT 0,
    last_counted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 4. CUSTOMER REGISTER & RUNNING DEBT BALANCES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    current_debt NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_debt >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 5. SALES & APPEND-ONLY PAYMENT RECORDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_tx_id UUID UNIQUE NOT NULL, -- For idempotent offline queue deduplication
    receipt_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    balance_amount NUMERIC(12, 2) NOT NULL CHECK (balance_amount >= 0),
    payment_status payment_status NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'cash',
    recorded_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_tx_id UUID UNIQUE NOT NULL,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    method payment_method NOT NULL,
    reference_note TEXT,
    recorded_by UUID NOT NULL REFERENCES profiles(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 6. PRODUCTION & RAW MATERIALS (MANUAL USAGE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_tx_id UUID UNIQUE NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity_produced INT NOT NULL CHECK (quantity_produced >= 0),
    quantity_damaged INT NOT NULL DEFAULT 0 CHECK (quantity_damaged >= 0),
    net_usable INT GENERATED ALWAYS AS (quantity_produced - quantity_damaged) STORED,
    batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS raw_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    unit_of_measure TEXT NOT NULL,
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_stock_alert NUMERIC(12, 2) NOT NULL DEFAULT 5.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS raw_material_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_tx_id UUID UNIQUE NOT NULL,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    movement_type raw_material_movement_type NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES profiles(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 7. DISTRIBUTOR ALLOCATIONS (STOCK CUSTODY != REVENUE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS distributor_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_tx_id UUID UNIQUE NOT NULL,
    distributor_id UUID NOT NULL REFERENCES profiles(id),
    allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status allocation_status NOT NULL DEFAULT 'assigned',
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    reconciled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS distributor_allocation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES distributor_allocations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity_allocated INT NOT NULL CHECK (quantity_allocated > 0),
    quantity_sold INT NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
    quantity_returned INT NOT NULL DEFAULT 0 CHECK (quantity_returned >= 0),
    notes TEXT
);

-- ==============================================================================
-- 8. AUDIT LOGGING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE finished_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_material_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_allocation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is owner
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'owner' AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is staff (owner or salesperson)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('owner', 'salesperson') AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view own profile; owner manages all
CREATE POLICY "Users view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR is_owner());

CREATE POLICY "Owner manages staff profiles" ON profiles
    FOR ALL USING (is_owner());

-- Products & Categories: All staff can view; only owner modifies
CREATE POLICY "Staff view products" ON products
    FOR SELECT USING (is_staff() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'distributor'));

CREATE POLICY "Owner manages products" ON products
    FOR ALL USING (is_owner());

CREATE POLICY "Staff view categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Owner manages categories" ON categories
    FOR ALL USING (is_owner());

-- Finished Stock: Staff can view; only owner or RPC modifies
CREATE POLICY "Staff view stock" ON finished_stock
    FOR SELECT USING (true);

CREATE POLICY "Owner updates stock" ON finished_stock
    FOR ALL USING (is_owner());

-- Customers: Staff can view and manage; distributors can view
CREATE POLICY "Staff view and insert customers" ON customers
    FOR ALL USING (is_staff());

CREATE POLICY "Distributors view customers" ON customers
    FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'distributor'));

-- Sales & Line Items: Staff can view and record sales
CREATE POLICY "Staff record and view sales" ON sales
    FOR ALL USING (is_staff());

CREATE POLICY "Staff record and view sale items" ON sale_items
    FOR ALL USING (is_staff());

-- Payments: Staff can record payments; no deletions permitted
CREATE POLICY "Staff view and record payments" ON payments
    FOR SELECT USING (is_staff());

CREATE POLICY "Staff insert payments" ON payments
    FOR INSERT WITH CHECK (is_staff());

-- Production: Staff can record production; owner can view all
CREATE POLICY "Staff view and record production" ON production_batches
    FOR ALL USING (is_staff());

-- Raw Materials: Staff can view and record
CREATE POLICY "Staff view raw materials" ON raw_materials
    FOR SELECT USING (is_staff());

CREATE POLICY "Owner manages raw materials" ON raw_materials
    FOR ALL USING (is_owner());

CREATE POLICY "Staff record raw movements" ON raw_material_movements
    FOR ALL USING (is_staff());

-- Distributor Allocations: Owner manages all; distributors view their own assigned
CREATE POLICY "Owner manages allocations" ON distributor_allocations
    FOR ALL USING (is_owner());

CREATE POLICY "Distributor views own allocations" ON distributor_allocations
    FOR SELECT USING (distributor_id = auth.uid());

CREATE POLICY "Owner manages allocation items" ON distributor_allocation_items
    FOR ALL USING (is_owner());

CREATE POLICY "Distributor views own allocation items" ON distributor_allocation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM distributor_allocations
            WHERE id = allocation_id AND distributor_id = auth.uid()
        )
    );

-- ==============================================================================
-- 10. ATOMIC RPC PROCEDURES (DATABASE TRANSACTIONS)
-- ==============================================================================

-- Atomic Sale Transaction with Single-Decrement Stock and Idempotency
CREATE OR REPLACE FUNCTION process_sale_transaction(
    p_client_tx_id UUID,
    p_receipt_number TEXT,
    p_customer_id UUID,
    p_total_amount NUMERIC,
    p_paid_amount NUMERIC,
    p_payment_method payment_method,
    p_recorded_by UUID,
    p_items JSONB,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id UUID;
    v_balance NUMERIC;
    v_status payment_status;
    v_item RECORD;
BEGIN
    -- Idempotency check: return existing sale if already processed
    SELECT id INTO v_sale_id FROM sales WHERE client_tx_id = p_client_tx_id;
    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id, 'is_duplicate', true);
    END IF;

    -- Calculate balance and status
    v_balance := p_total_amount - p_paid_amount;
    IF v_balance <= 0 THEN
        v_status := 'paid';
        v_balance := 0;
    ELSIF p_paid_amount > 0 THEN
        v_status := 'partial';
    ELSE
        v_status := 'credit';
    END IF;

    -- Insert sale header
    INSERT INTO sales (
        client_tx_id, receipt_number, customer_id, total_amount, paid_amount, balance_amount, payment_status, payment_method, recorded_by, notes
    ) VALUES (
        p_client_tx_id, p_receipt_number, p_customer_id, p_total_amount, p_paid_amount, v_balance, v_status, p_payment_method, p_recorded_by, p_notes
    ) RETURNING id INTO v_sale_id;

    -- Insert sale line items & decrement finished stock atomically
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT, unit_price NUMERIC, subtotal NUMERIC)
    LOOP
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
        VALUES (v_sale_id, v_item.product_id, v_item.quantity, v_item.unit_price, v_item.subtotal);

        UPDATE finished_stock
        SET current_stock = current_stock - v_item.quantity,
            updated_at = timezone('utc', now())
        WHERE product_id = v_item.product_id;
    END LOOP;

    -- Record initial payment if paid > 0
    IF p_paid_amount > 0 THEN
        INSERT INTO payments (
            client_tx_id, sale_id, customer_id, amount, method, reference_note, recorded_by
        ) VALUES (
            gen_random_uuid(), v_sale_id, p_customer_id, p_paid_amount, p_payment_method, 'Initial sale settlement', p_recorded_by
        );
    END IF;

    -- Update customer running debt balance
    IF v_balance > 0 THEN
        UPDATE customers
        SET current_debt = current_debt + v_balance,
            updated_at = timezone('utc', now())
        WHERE id = p_customer_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id, 'balance', v_balance);
END;
$$;

-- Atomic Debt Repayment against original sale
CREATE OR REPLACE FUNCTION record_debt_repayment(
    p_client_tx_id UUID,
    p_sale_id UUID,
    p_amount NUMERIC,
    p_method payment_method,
    p_reference_note TEXT,
    p_recorded_by UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id UUID;
    v_total NUMERIC;
    v_paid NUMERIC;
    v_new_paid NUMERIC;
    v_new_balance NUMERIC;
    v_new_status payment_status;
BEGIN
    SELECT customer_id, total_amount, paid_amount
    INTO v_customer_id, v_total, v_paid
    FROM sales
    WHERE id = p_sale_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sale record not found');
    END IF;

    v_new_paid := v_paid + p_amount;
    v_new_balance := GREATEST(0, v_total - v_new_paid);
    IF v_new_balance = 0 THEN
        v_new_status := 'paid';
    ELSE
        v_new_status := 'partial';
    END IF;

    -- Update original sale
    UPDATE sales
    SET paid_amount = v_new_paid,
        balance_amount = v_new_balance,
        payment_status = v_new_status,
        updated_at = timezone('utc', now())
    WHERE id = p_sale_id;

    -- Insert payment entry into audit ledger
    INSERT INTO payments (
        client_tx_id, sale_id, customer_id, amount, method, reference_note, recorded_by
    ) VALUES (
        p_client_tx_id, p_sale_id, v_customer_id, p_amount, p_method, p_reference_note, p_recorded_by
    );

    -- Reduce customer debt balance
    UPDATE customers
    SET current_debt = GREATEST(0, current_debt - p_amount),
        updated_at = timezone('utc', now())
    WHERE id = v_customer_id;

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

