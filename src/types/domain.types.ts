export type UserRole = 'owner' | 'salesperson' | 'distributor';

export interface StaffUser {
  id: string;
  name: string;
  emailOrPhone: string;
  role: UserRole;
  pin: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  currentDebt: number;
  notes?: string;
  isActive: boolean;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type PaymentStatus = 'paid' | 'partial' | 'credit';
export type PaymentMethod = 'cash' | 'transfer' | 'pos';
export type SyncStatus = 'saved_locally' | 'pending' | 'synced' | 'needs_review';

export interface Sale {
  id: string;
  clientTxId: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  recordedBy: string;
  createdAt: string;
  syncStatus: SyncStatus;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  saleId: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  referenceNote?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface ProductionBatch {
  id: string;
  productId: string;
  productName: string;
  quantityProduced: number;
  quantityDamaged: number;
  netUsable: number;
  batchDate: string;
  recordedBy: string;
  notes?: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  unitOfMeasure: string;
  currentStock: number;
  minStockAlert: number;
}

export type RawMaterialMovementType = 'receipt' | 'usage' | 'waste';

export interface RawMaterialMovement {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  movementType: RawMaterialMovementType;
  quantity: number;
  unitOfMeasure: string;
  recordedBy: string;
  createdAt: string;
  notes?: string;
}

export interface DistributorAllocationItem {
  productId: string;
  productName: string;
  quantityAllocated: number;
  quantitySold: number;
  quantityReturned: number;
  quantityDamaged?: number;
  quantityShortage?: number;
}

export type AllocationStatus = 'assigned' | 'acknowledged' | 'submitted' | 'reconciled';

export interface DistributorAllocation {
  id: string;
  distributorId: string;
  distributorName: string;
  allocationDate: string;
  status: AllocationStatus;
  items: DistributorAllocationItem[];
  totalAllocatedValue: number;
  totalCollectedValue: number;
  shortageTotalValue?: number;
  shortageResolution?: 'debited_to_driver' | 'bakery_loss_approved' | 'none';
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

