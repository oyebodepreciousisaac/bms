import { supabase, isSupabaseConfigured } from './supabase';
import { Sale, Customer, Product, PaymentMethod } from '../types/domain.types';

export const supabaseService = {
  /**
   * Process a sale atomically via PostgreSQL RPC
   */
  async processSale(params: {
    clientTxId: string;
    receiptNumber: string;
    customerId: string;
    totalAmount: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    recordedBy: string;
    items: { productId: string; quantity: number; unitPrice: number; subtotal: number }[];
    notes?: string;
  }) {
    if (!isSupabaseConfigured) {
      return { success: true, isLocalFallback: true };
    }

    const { data, error } = await (supabase.rpc as any)('process_sale_transaction', {
      p_client_tx_id: params.clientTxId,
      p_receipt_number: params.receiptNumber,
      p_customer_id: params.customerId,
      p_total_amount: params.totalAmount,
      p_paid_amount: params.paidAmount,
      p_payment_method: params.paymentMethod,
      p_recorded_by: params.recordedBy,
      p_items: params.items as any,
      p_notes: params.notes,
    });

    if (error) {
      console.error('Supabase RPC process_sale_transaction failed:', error);
      throw error;
    }

    return data;
  },

  /**
   * Record debt repayment against an existing sale via PostgreSQL RPC
   */
  async recordDebtRepayment(params: {
    clientTxId: string;
    saleId: string;
    amount: number;
    method: PaymentMethod;
    referenceNote: string;
    recordedBy: string;
  }) {
    if (!isSupabaseConfigured) {
      return { success: true, isLocalFallback: true };
    }

    const { data, error } = await (supabase.rpc as any)('record_debt_repayment', {
      p_client_tx_id: params.clientTxId,
      p_sale_id: params.saleId,
      p_amount: params.amount,
      p_method: params.method,
      p_reference_note: params.referenceNote,
      p_recorded_by: params.recordedBy,
    });

    if (error) {
      console.error('Supabase RPC record_debt_repayment failed:', error);
      throw error;
    }

    return data;
  },

  /**
   * Fetch active product catalog with finished stock
   */
  async fetchProducts(): Promise<Product[] | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('products')
      .select('*, finished_stock(current_stock)')
      .eq('is_active', true);

    if (error) {
      console.warn('Failed to fetch products from Supabase:', error.message);
      return null;
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category_id || 'General',
      unitPrice: Number(p.unit_price),
      currentStock: p.finished_stock?.current_stock ?? 0,
      minStockAlert: p.min_stock_alert,
      isActive: p.is_active,
    }));
  },

  /**
   * Fetch customer register with running credit balances
   */
  async fetchCustomers(): Promise<Customer[] | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.warn('Failed to fetch customers from Supabase:', error.message);
      return null;
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      currentDebt: Number(c.current_debt),
      notes: c.notes || undefined,
      isActive: c.is_active,
    }));
  },
};
