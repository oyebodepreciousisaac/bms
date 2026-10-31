export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'owner' | 'salesperson' | 'distributor';
export type PaymentStatus = 'paid' | 'partial' | 'credit';
export type PaymentMethod = 'cash' | 'transfer' | 'pos';
export type AllocationStatus = 'assigned' | 'acknowledged' | 'reconciled';
export type RawMaterialMovementType = 'receipt' | 'usage' | 'waste';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          unit_price: number;
          min_stock_alert: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          unit_price: number;
          min_stock_alert?: number;
          is_active?: boolean;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          unit_price?: number;
          min_stock_alert?: number;
          is_active?: boolean;
        };
      };
      finished_stock: {
        Row: {
          product_id: string;
          current_stock: number;
          last_counted_at: string;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          current_stock?: number;
        };
        Update: {
          current_stock?: number;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
          current_debt: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          current_debt?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          current_debt?: number;
          is_active?: boolean;
        };
      };
      sales: {
        Row: {
          id: string;
          client_tx_id: string;
          receipt_number: string;
          customer_id: string;
          total_amount: number;
          paid_amount: number;
          balance_amount: number;
          payment_status: PaymentStatus;
          payment_method: PaymentMethod;
          recorded_by: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_tx_id: string;
          receipt_number: string;
          customer_id: string;
          total_amount: number;
          paid_amount?: number;
          balance_amount: number;
          payment_status: PaymentStatus;
          payment_method?: PaymentMethod;
          recorded_by: string;
          notes?: string | null;
        };
        Update: {
          paid_amount?: number;
          balance_amount?: number;
          payment_status?: PaymentStatus;
          notes?: string | null;
        };
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
      };
      payments: {
        Row: {
          id: string;
          client_tx_id: string;
          sale_id: string;
          customer_id: string;
          amount: number;
          method: PaymentMethod;
          reference_note: string | null;
          recorded_by: string;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          client_tx_id: string;
          sale_id: string;
          customer_id: string;
          amount: number;
          method: PaymentMethod;
          reference_note?: string | null;
          recorded_by: string;
        };
      };
    };
    Functions: {
      process_sale_transaction: {
        Args: {
          p_client_tx_id: string;
          p_receipt_number: string;
          p_customer_id: string;
          p_total_amount: number;
          p_paid_amount: number;
          p_payment_method: PaymentMethod;
          p_recorded_by: string;
          p_items: Json;
          p_notes?: string;
        };
        Returns: Json;
      };
      record_debt_repayment: {
        Args: {
          p_client_tx_id: string;
          p_sale_id: string;
          p_amount: number;
          p_method: PaymentMethod;
          p_reference_note: string;
          p_recorded_by: string;
        };
        Returns: Json;
      };
    };
  };
}

