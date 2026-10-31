import Dexie, { Table } from 'dexie';
import { Sale, PaymentRecord, Product, Customer } from '../types/domain.types';

export interface PendingSyncItem {
  id: string; // clientTxId (deterministic UUID)
  entityType: 'SALE' | 'PAYMENT' | 'PRODUCTION_BATCH';
  payload: any;
  status: 'saved_locally' | 'syncing' | 'synced' | 'failed' | 'needs_review';
  retryCount: number;
  lastAttempt?: string;
  errorMessage?: string;
  createdAt: string;
}

export class BakeryDatabase extends Dexie {
  sales!: Table<Sale, string>;
  payments!: Table<PaymentRecord, string>;
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  syncQueue!: Table<PendingSyncItem, string>;

  constructor() {
    super('BMS_Offline_Database');
    this.version(1).stores({
      sales: 'id, clientTxId, receiptNumber, customerId, paymentStatus, syncStatus, createdAt',
      payments: 'id, saleId, customerId, recordedAt',
      products: 'id, name, category, isActive',
      customers: 'id, name, phone, currentDebt',
      syncQueue: 'id, entityType, status, createdAt',
    });
  }
}

export const localDb = new BakeryDatabase();

