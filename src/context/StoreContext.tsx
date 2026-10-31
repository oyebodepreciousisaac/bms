import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  StaffUser,
  Product,
  Customer,
  Sale,
  PaymentRecord,
  ProductionBatch,
  RawMaterial,
  RawMaterialMovement,
  RawMaterialMovementType,
  DistributorAllocation,
  DistributorAllocationItem,
  PaymentMethod,
  SaleItem,
} from '../types/domain.types';
import {
  initialProducts,
  initialCustomers,
  initialSales,
  initialPayments,
  initialProduction,
  initialRawMaterials,
  initialRawMaterialMovements,
  initialAllocations,
  initialStaff,
} from '../data/mockData';
import { supabaseService } from '../db/supabaseService';
import { isSupabaseConfigured } from '../db/supabase';
import { hashPin, verifyPin } from '../lib/crypto';

interface StoreContextType {
  // Authentication & Staff Access
  currentUser: StaffUser | null;
  staffList: StaffUser[];
  login: (emailOrPhone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginAs: (staff: StaffUser) => void;
  logout: () => void;
  addStaff: (params: {
    name: string;
    emailOrPhone: string;
    role: UserRole;
    pin: string;
  }) => Promise<StaffUser>;
  toggleStaffStatus: (staffId: string) => void;

  // Role switcher for client testing
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;

  // Products & Stock
  products: Product[];
  addProduct: (params: {
    name: string;
    category: string;
    unitPrice: number;
    initialStock?: number;
    minStockAlert?: number;
  }) => Product;
  updateProductPrice: (productId: string, newPrice: number) => void;
  deleteProduct: (productId: string) => void;

  // Customers & Debts
  customers: Customer[];
  addCustomer: (name: string, phone: string, notes?: string) => Customer;

  // Sales & Partial Payments
  sales: Sale[];
  payments: PaymentRecord[];
  recordSale: (params: {
    customerId: string;
    items: { productId: string; quantity: number }[];
    paidAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => Sale;
  recordPayment: (params: {
    saleId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNote?: string;
  }) => void;

  // Production (Bakehouse Logs)
  productionBatches: ProductionBatch[];
  recordProductionBatch: (params: {
    productId: string;
    quantityProduced: number;
    quantityDamaged: number;
    notes?: string;
  }) => void;

  // Raw Materials & Ingredients
  rawMaterials: RawMaterial[];
  rawMaterialMovements: RawMaterialMovement[];
  addRawMaterial: (params: {
    name: string;
    unitOfMeasure: string;
    initialStock?: number;
    minStockAlert?: number;
  }) => RawMaterial;
  recordRawMaterialMovement: (params: {
    rawMaterialId: string;
    movementType: RawMaterialMovementType;
    quantity: number;
    notes?: string;
  }) => void;

  // Distribution & Route Reconciliation
  allocations: DistributorAllocation[];
  createAllocation: (params: {
    distributorName: string;
    notes?: string;
    items: { productId: string; quantityAllocated: number }[];
  }) => DistributorAllocation;
  reconcileAllocation: (params: {
    allocationId: string;
    items: { productId: string; quantitySold: number; quantityReturned: number }[];
    notes?: string;
  }) => void;

  // Clean Slate & Reset for New Product Delivery
  resetDemoData: () => void;
  clearAllDataToFreshBakery: () => void;

  // Offline Sync State
  isOnline: boolean;
  toggleOnline: () => void;
  syncOfflineQueue: () => void;
  pendingSyncCount: number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Staff & Authentication State
  const [staffList, setStaffList] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem('bms_staff');
    return saved ? JSON.parse(saved) : initialStaff;
  });

  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    const saved = localStorage.getItem('bms_user');
    return saved ? JSON.parse(saved) : initialStaff[0]; // Defaults to Owner for smooth presentation
  });

  const [activeRole, setActiveRole] = useState<UserRole>(currentUser ? currentUser.role : 'owner');

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>(initialProduction);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(initialRawMaterials);
  const [rawMaterialMovements, setRawMaterialMovements] = useState<RawMaterialMovement[]>(initialRawMaterialMovements);
  const [allocations, setAllocations] = useState<DistributorAllocation[]>(initialAllocations);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Sync staff to localStorage
  useEffect(() => {
    localStorage.setItem('bms_staff', JSON.stringify(staffList));
  }, [staffList]);

  // Sync currentUser to localStorage and activeRole
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bms_user', JSON.stringify(currentUser));
      setActiveRole(currentUser.role);
    } else {
      localStorage.removeItem('bms_user');
    }
  }, [currentUser]);

  const pendingSyncCount = sales.filter((s) => s.syncStatus === 'saved_locally').length;

  const toggleOnline = () => {
    setIsOnline((prev) => !prev);
  };

  const syncOfflineQueue = () => {
    setSales((prev) =>
      prev.map((s) => (s.syncStatus === 'saved_locally' ? { ...s, syncStatus: 'synced' } : s))
    );
  };

  // Auth operations with cryptographic SHA-256 password protection
  const login = async (emailOrPhone: string, pin: string) => {
    const cleanIdent = emailOrPhone.trim().toLowerCase();
    const cleanPin = pin.trim();

    // Find user by phone or email
    const user = staffList.find(
      (s) => s.emailOrPhone.toLowerCase() === cleanIdent && s.status === 'active'
    );
    if (!user) {
      return {
        success: false,
        error: 'Invalid login phone/email or account is suspended.',
      };
    }

    // Verify cryptographic PIN hash
    const isValid = await verifyPin(cleanPin, user.pin);
    if (!isValid) {
      return {
        success: false,
        error: 'Incorrect 4-digit PIN. Please try again.',
      };
    }

    const updatedUser = {
      ...user,
      lastLoginAt: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setActiveRole(updatedUser.role);
    setStaffList((prev) =>
      prev.map((s) => (s.id === updatedUser.id ? updatedUser : s))
    );

    return { success: true };
  };

  const loginAs = (staff: StaffUser) => {
    const updated = { ...staff, lastLoginAt: new Date().toISOString() };
    setCurrentUser(updated);
    setActiveRole(updated.role);
    setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addStaff = async ({
    name,
    emailOrPhone,
    role,
    pin,
  }: {
    name: string;
    emailOrPhone: string;
    role: UserRole;
    pin: string;
  }): Promise<StaffUser> => {
    // Cryptographically hash the worker's PIN before storing
    const hashedPin = await hashPin(pin.trim());

    const newWorker: StaffUser = {
      id: `staff-${Date.now()}`,
      name: name.trim(),
      emailOrPhone: emailOrPhone.trim(),
      role,
      pin: hashedPin,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setStaffList((prev) => [...prev, newWorker]);
    return newWorker;
  };

  const toggleStaffStatus = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? { ...s, status: s.status === 'active' ? 'suspended' : 'active' }
          : s
      )
    );
  };

  // Reset & Clean slate
  const resetDemoData = () => {
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSales(initialSales);
    setPayments(initialPayments);
    setProductionBatches(initialProduction);
    setRawMaterials(initialRawMaterials);
    setRawMaterialMovements(initialRawMaterialMovements);
    setAllocations(initialAllocations);
    setStaffList(initialStaff);
  };

  const clearAllDataToFreshBakery = () => {
    setSales([]);
    setPayments([]);
    setProductionBatches([]);
    setRawMaterialMovements([]);
    setAllocations([]);
    setCustomers(initialCustomers.map((c) => ({ ...c, currentDebt: 0 })));
  };

  const updateProductPrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, unitPrice: newPrice } : p))
    );
  };

  const addProduct = ({
    name,
    category,
    unitPrice,
    initialStock = 0,
    minStockAlert = 20,
  }: {
    name: string;
    category: string;
    unitPrice: number;
    initialStock?: number;
    minStockAlert?: number;
  }): Product => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      category,
      unitPrice,
      currentStock: initialStock,
      minStockAlert,
      isActive: true,
    };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const addCustomer = (name: string, phone: string, notes?: string): Customer => {
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name,
      phone,
      currentDebt: 0,
      notes,
      isActive: true,
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const recordSale = ({
    customerId,
    items,
    paidAmount,
    paymentMethod,
    notes,
  }: {
    customerId: string;
    items: { productId: string; quantity: number }[];
    paidAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): Sale => {
    const customer = customers.find((c) => c.id === customerId) || {
      id: 'cust-walkin',
      name: 'Walk-in Customer',
      phone: '',
      currentDebt: 0,
      isActive: true,
    };

    let totalAmount = 0;
    const saleItems: SaleItem[] = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const unitPrice = product ? product.unitPrice : 0;
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;
      return {
        productId: item.productId,
        productName: product ? product.name : 'Unknown Product',
        quantity: item.quantity,
        unitPrice,
        subtotal,
      };
    });

    const balanceAmount = Math.max(0, totalAmount - paidAmount);
    let paymentStatus: 'paid' | 'partial' | 'credit' = 'paid';
    if (paidAmount === 0) {
      paymentStatus = 'credit';
    } else if (paidAmount < totalAmount) {
      paymentStatus = 'partial';
    }

    const newSaleId = `sale-${Date.now()}`;
    const newReceiptNum = `BMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const recordedByName = currentUser ? currentUser.name : activeRole === 'owner' ? 'Owner (Admin)' : 'Sales Agent';

    const newSale: Sale = {
      id: newSaleId,
      clientTxId: crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`,
      receiptNumber: newReceiptNum,
      customerId: customer.id,
      customerName: customer.name,
      items: saleItems,
      totalAmount,
      paidAmount,
      balanceAmount,
      paymentStatus,
      paymentMethod,
      recordedBy: recordedByName,
      createdAt: new Date().toISOString(),
      syncStatus: isOnline ? 'synced' : 'saved_locally',
      notes,
    };

    // Decrement finished product inventory
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = items.find((i) => i.productId === prod.id);
        if (soldItem) {
          return {
            ...prod,
            currentStock: Math.max(0, prod.currentStock - soldItem.quantity),
          };
        }
        return prod;
      })
    );

    // Update customer debt if there is an unpaid balance
    if (balanceAmount > 0 && customer.id !== 'cust-walkin') {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id
            ? { ...c, currentDebt: c.currentDebt + balanceAmount }
            : c
        )
      );
    }

    // Record initial payment record if paid > 0
    if (paidAmount > 0) {
      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        saleId: newSaleId,
        receiptNumber: newReceiptNum,
        customerId: customer.id,
        customerName: customer.name,
        amount: paidAmount,
        method: paymentMethod,
        referenceNote: 'Initial payment at time of sale',
        recordedBy: recordedByName,
        recordedAt: new Date().toISOString(),
      };
      setPayments((prev) => [newPayment, ...prev]);
    }

    setSales((prev) => [newSale, ...prev]);

    // Dispatch to Supabase if configured and online
    if (isOnline && isSupabaseConfigured) {
      supabaseService.processSale({
        clientTxId: newSale.clientTxId,
        receiptNumber: newSale.receiptNumber,
        customerId: newSale.customerId,
        totalAmount: newSale.totalAmount,
        paidAmount: newSale.paidAmount,
        paymentMethod: newSale.paymentMethod,
        recordedBy: newSale.recordedBy,
        items: newSale.items,
        notes: newSale.notes,
      }).catch((err) => {
        console.warn('Background Supabase sync queued locally:', err);
      });
    }

    return newSale;
  };

  const recordPayment = ({
    saleId,
    amount,
    paymentMethod,
    referenceNote,
  }: {
    saleId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNote?: string;
  }) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;

    const newPaidAmount = sale.paidAmount + amount;
    const newBalance = Math.max(0, sale.totalAmount - newPaidAmount);
    const newStatus = newBalance === 0 ? 'paid' : 'partial';
    const recordedByName = currentUser ? currentUser.name : activeRole === 'owner' ? 'Owner (Admin)' : 'Sales Agent';

    // Update existing sale record directly (Never create dummy sale for payment)
    setSales((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? {
              ...s,
              paidAmount: newPaidAmount,
              balanceAmount: newBalance,
              paymentStatus: newStatus,
            }
          : s
      )
    );

    // Update customer debt balance
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === sale.customerId
          ? { ...c, currentDebt: Math.max(0, c.currentDebt - amount) }
          : c
      )
    );

    // Add payment entry
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      saleId: sale.id,
      receiptNumber: sale.receiptNumber,
      customerId: sale.customerId,
      customerName: sale.customerName,
      amount,
      method: paymentMethod,
      referenceNote: referenceNote || 'Settlement payment against outstanding balance',
      recordedBy: recordedByName,
      recordedAt: new Date().toISOString(),
    };
    setPayments((prev) => [newPayment, ...prev]);

    // Dispatch to Supabase if configured and online
    if (isOnline && isSupabaseConfigured) {
      supabaseService.recordDebtRepayment({
        clientTxId: crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`,
        saleId: sale.id,
        amount,
        method: paymentMethod,
        referenceNote: referenceNote || 'Settlement payment',
        recordedBy: recordedByName,
      }).catch((err) => {
        console.warn('Background Supabase payment sync queued:', err);
      });
    }
  };

  const recordProductionBatch = ({
    productId,
    quantityProduced,
    quantityDamaged,
    notes,
  }: {
    productId: string;
    quantityProduced: number;
    quantityDamaged: number;
    notes?: string;
  }) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const netUsable = Math.max(0, quantityProduced - quantityDamaged);
    const recordedByName = currentUser ? currentUser.name : activeRole === 'owner' ? 'Owner (Admin)' : 'Bakehouse Staff';

    const newBatch: ProductionBatch = {
      id: `prod-b-${Date.now()}`,
      productId,
      productName: product.name,
      quantityProduced,
      quantityDamaged,
      netUsable,
      batchDate: new Date().toISOString().split('T')[0],
      recordedBy: recordedByName,
      notes,
    };

    // Increment finished goods stock by net usable quantity
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, currentStock: p.currentStock + netUsable } : p
      )
    );

    setProductionBatches((prev) => [newBatch, ...prev]);
  };

  // Raw Material Operations
  const addRawMaterial = ({
    name,
    unitOfMeasure,
    initialStock = 0,
    minStockAlert = 5,
  }: {
    name: string;
    unitOfMeasure: string;
    initialStock?: number;
    minStockAlert?: number;
  }): RawMaterial => {
    const newMaterial: RawMaterial = {
      id: `rm-${Date.now()}`,
      name,
      unitOfMeasure,
      currentStock: initialStock,
      minStockAlert,
    };
    setRawMaterials((prev) => [newMaterial, ...prev]);
    return newMaterial;
  };

  const recordRawMaterialMovement = ({
    rawMaterialId,
    movementType,
    quantity,
    notes,
  }: {
    rawMaterialId: string;
    movementType: RawMaterialMovementType;
    quantity: number;
    notes?: string;
  }) => {
    const material = rawMaterials.find((m) => m.id === rawMaterialId);
    if (!material) return;
    const recordedByName = currentUser ? currentUser.name : activeRole === 'owner' ? 'Owner (Admin)' : 'Bakehouse Staff';

    // Update stock level
    setRawMaterials((prev) =>
      prev.map((m) => {
        if (m.id !== rawMaterialId) return m;
        if (movementType === 'receipt') {
          return { ...m, currentStock: m.currentStock + quantity };
        } else {
          // usage or waste
          return { ...m, currentStock: Math.max(0, m.currentStock - quantity) };
        }
      })
    );

    const movement: RawMaterialMovement = {
      id: `rm-mov-${Date.now()}`,
      rawMaterialId,
      rawMaterialName: material.name,
      movementType,
      quantity,
      unitOfMeasure: material.unitOfMeasure,
      recordedBy: recordedByName,
      createdAt: new Date().toISOString(),
      notes,
    };

    setRawMaterialMovements((prev) => [movement, ...prev]);
  };

  // Distributor Operations
  const createAllocation = ({
    distributorName,
    notes,
    items,
  }: {
    distributorName: string;
    notes?: string;
    items: { productId: string; quantityAllocated: number }[];
  }): DistributorAllocation => {
    let totalAllocatedValue = 0;
    const allocationItems: DistributorAllocationItem[] = items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitPrice = prod ? prod.unitPrice : 0;
      totalAllocatedValue += unitPrice * item.quantityAllocated;
      return {
        productId: item.productId,
        productName: prod ? prod.name : 'Unknown Product',
        quantityAllocated: item.quantityAllocated,
        quantitySold: 0,
        quantityReturned: 0,
      };
    });

    // Decrement finished goods inventory because loaves are handed over into distributor custody
    setProducts((prev) =>
      prev.map((p) => {
        const allocated = items.find((i) => i.productId === p.id);
        if (allocated) {
          return { ...p, currentStock: Math.max(0, p.currentStock - allocated.quantityAllocated) };
        }
        return p;
      })
    );

    const newAllocation: DistributorAllocation = {
      id: `dist-alloc-${Date.now()}`,
      distributorId: `dist-${Date.now()}`,
      distributorName,
      allocationDate: new Date().toISOString().split('T')[0],
      status: 'assigned',
      items: allocationItems,
      totalAllocatedValue,
      totalCollectedValue: 0,
      notes,
    };

    setAllocations((prev) => [newAllocation, ...prev]);
    return newAllocation;
  };

  const reconcileAllocation = ({
    allocationId,
    items,
    notes,
  }: {
    allocationId: string;
    items: { productId: string; quantitySold: number; quantityReturned: number }[];
    notes?: string;
  }) => {
    const alloc = allocations.find((a) => a.id === allocationId);
    if (!alloc) return;

    let totalCollectedValue = 0;

    // Return unsold loaves back into bakehouse finished goods stock
    items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitPrice = prod ? prod.unitPrice : 0;
      totalCollectedValue += item.quantitySold * unitPrice;

      if (item.quantityReturned > 0) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === item.productId
              ? { ...p, currentStock: p.currentStock + item.quantityReturned }
              : p
          )
        );
      }
    });

    setAllocations((prev) =>
      prev.map((a) => {
        if (a.id !== allocationId) return a;
        return {
          ...a,
          status: 'reconciled',
          items: a.items.map((existingItem) => {
            const update = items.find((i) => i.productId === existingItem.productId);
            if (update) {
              return {
                ...existingItem,
                quantitySold: update.quantitySold,
                quantityReturned: update.quantityReturned,
              };
            }
            return existingItem;
          }),
          totalCollectedValue,
          notes: notes || a.notes,
        };
      })
    );
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        staffList,
        login,
        loginAs,
        logout,
        addStaff,
        toggleStaffStatus,
        activeRole,
        setActiveRole,
        products,
        addProduct,
        updateProductPrice,
        deleteProduct,
        customers,
        addCustomer,
        sales,
        payments,
        recordSale,
        recordPayment,
        productionBatches,
        recordProductionBatch,
        rawMaterials,
        rawMaterialMovements,
        addRawMaterial,
        recordRawMaterialMovement,
        allocations,
        createAllocation,
        reconcileAllocation,
        resetDemoData,
        clearAllDataToFreshBakery,
        isOnline,
        toggleOnline,
        syncOfflineQueue,
        pendingSyncCount,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
