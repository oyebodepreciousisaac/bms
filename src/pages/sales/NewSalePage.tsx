import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ReceiptModal } from '../../components/printing/ReceiptModal';
import { InvoiceModal } from '../../components/printing/InvoiceModal';
import { AddProductModal } from '../../components/common/AddProductModal';
import { PaymentMethod, Sale } from '../../types/domain.types';
import {
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  User,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  FileText,
  Receipt,
  ArrowDown,
  PlusCircle,
  X,
  Sparkles,
  AlertTriangle,
  Ban,
} from 'lucide-react';

interface CartItem {
  productId: string;
  quantity: number;
}

export const NewSalePage: React.FC = () => {
  const { products, customers, recordSale, activeRole } = useStore();
  const orderSectionRef = useRef<HTMLDivElement>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [isAddBreadModalOpen, setIsAddBreadModalOpen] = useState<boolean>(false);

  // Warning toast when quantity reaches or attempts to exceed stock
  const [stockWarning, setStockWarning] = useState<string | null>(null);

  const triggerWarning = (msg: string) => {
    setStockWarning(msg);
    setTimeout(() => setStockWarning(null), 3000);
  };

  // Available categories
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Cart operations with stock availability clamping
  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.currentStock <= 0) {
      triggerWarning(`"${product?.name || 'Item'}" is currently OUT OF STOCK and cannot be added.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          triggerWarning(`Only ${product.currentStock} loaves of ${product.name} are available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty > product.currentStock) {
              triggerWarning(`Maximum available stock for ${product.name} is ${product.currentStock} loaves.`);
              return { ...item, quantity: product.currentStock };
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Directly typing quantity (e.g. 50, 100, 500 pcs)
  const setDirectQuantity = (productId: string, rawVal: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (rawVal === '') {
      setCart((prev) =>
        prev.map((item) => (item.productId === productId ? { ...item, quantity: 0 } : item))
      );
      return;
    }

    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed) || parsed < 0) return;

    if (parsed > product.currentStock) {
      triggerWarning(`Cannot order ${parsed} loaves. Only ${product.currentStock} available in stock.`);
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity: product.currentStock } : item
        )
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: parsed } : item
      )
    );
  };

  const handleBlurQuantity = (productId: string) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            return item.quantity <= 0 ? null : item;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaidInput('');
  };

  // Calculations
  const validCartItems = cart.filter((item) => item.quantity > 0);

  const totalAmount = validCartItems.reduce((acc, item) => {
    const product = products.find((p) => p.id === item.productId);
    return acc + (product ? product.unitPrice * item.quantity : 0);
  }, 0);

  const totalQuantity = validCartItems.reduce((acc, item) => acc + item.quantity, 0);

  const numericPaidAmount = amountPaidInput === '' ? totalAmount : parseFloat(amountPaidInput) || 0;
  const balanceDue = Math.max(0, totalAmount - numericPaidAmount);

  // Quick payment autofill helpers
  const handleFullPayment = () => {
    setAmountPaidInput(totalAmount.toString());
  };

  const handleZeroPayment = () => {
    setAmountPaidInput('0');
  };

  const scrollToCheckout = () => {
    orderSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (validCartItems.length === 0) return;

    // Final availability verification before recording
    for (const item of validCartItems) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod || prod.currentStock < item.quantity) {
        triggerWarning(
          `Cannot complete sale: ${prod?.name || 'Product'} does not have ${item.quantity} loaves available!`
        );
        return;
      }
    }

    const sale = recordSale({
      customerId: selectedCustomerId,
      items: validCartItems,
      paidAmount: numericPaidAmount,
      paymentMethod,
      notes,
    });

    setCompletedSale(sale);
    setShowReceipt(true);
    setCart([]);
    setAmountPaidInput('');
    setNotes('');
  };

  return (
    <div className="space-y-4 pb-28 lg:pb-6">
      {/* Toast Alert for Stock Limits */}
      {stockWarning && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
          <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-xl flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{stockWarning}</span>
            </div>
            <button
              type="button"
              onClick={() => setStockWarning(null)}
              className="text-white hover:opacity-80 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Page Title & Staff Training Guide */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Point of Sale (New Sale)
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Touch-first sale recording. Out-of-stock bread is blocked, and quantities can be typed directly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900">
          <span className="font-bold px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-950 shrink-0 uppercase text-[9px]">
            Stock Rule
          </span>
          <span className="leading-tight">
            Orders can only be accepted for items <strong>currently in stock</strong>. For bulk orders (e.g. 500 pcs), click the quantity box to type the exact number directly instead of clicking (+).
          </span>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: Product Catalog (7 cols on Desktop) */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Customer Selection & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer Picker */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Customer / Debtor Account
              </label>
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full h-10 px-3 pl-9 rounded-md border border-border bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.currentDebt > 0 ? `(Owes ${formatCurrency(c.currentDebt)})` : ''}
                    </option>
                  ))}
                </select>
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Search Catalog */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-foreground">
                  Search Catalog
                </label>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search bread, rolls, specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 px-3 pl-10 pr-9 rounded-xl border border-border bg-surface text-xs font-medium text-foreground placeholder:text-muted-foreground transition-all hover:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-xs"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category Filter Pills & Store Owner Custom Bread Action */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 pb-3 scrollbar-none mb-1">
            <div className="flex items-center gap-2 shrink-0 py-1">
              {categories.map((cat) => {
                const count = cat === 'All' ? products.length : products.filter((p) => p.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap min-h-[36px] ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs ring-2 ring-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-border active:scale-95'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-background/90 text-muted-foreground'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Add Custom Bread Button directly on POS */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddBreadModalOpen(true)}
              className="shrink-0 h-9 text-xs gap-1.5 text-primary border-primary/40 bg-primary-light/40 hover:bg-primary-light font-bold"
              title="Store owner can define any bread style (Sardine, Agege, etc.)"
            >
              <PlusCircle className="h-3.5 w-3.5 text-primary" />
              <span>+ Add Custom Bread</span>
            </Button>
          </div>

          {/* Touch-Friendly Product Cards Grid with Stock Availability Logic */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {filteredProducts.map((product) => {
              const inCartItem = cart.find((i) => i.productId === product.id);
              const qtyInCart = inCartItem?.quantity || 0;
              const isOutOfStock = product.currentStock <= 0;
              const isLow = !isOutOfStock && product.currentStock <= product.minStockAlert;
              const isAtMaxStock = qtyInCart >= product.currentStock && product.currentStock > 0;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (isOutOfStock) {
                      triggerWarning(`"${product.name}" is OUT OF STOCK. Bake or log a batch before selling.`);
                      return;
                    }
                    addToCart(product.id);
                  }}
                  className={`group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-lg border text-left transition-all select-none ${
                    isOutOfStock
                      ? 'border-border/60 bg-muted/40 opacity-60 cursor-not-allowed'
                      : qtyInCart > 0
                      ? 'border-primary bg-primary-light/50 ring-2 ring-primary/40 cursor-pointer active:scale-[0.98]'
                      : 'border-border bg-surface hover:border-primary/50 cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-xs sm:text-sm text-foreground leading-tight">
                        {product.name}
                      </span>
                      {qtyInCart > 0 && (
                        <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                          {qtyInCart}
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-1 text-[10px] uppercase font-semibold text-muted-foreground">
                      {product.category}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm text-primary">
                      {formatCurrency(product.unitPrice)}
                    </span>
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Ban className="h-3 w-3" /> Out of Stock
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold ${
                          isLow ? 'text-destructive font-bold' : 'text-muted-foreground'
                        }`}
                      >
                        {product.currentStock} left
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick "+ Add New Bread Style" Card for Store Owner & Staff */}
            <button
              type="button"
              onClick={() => setIsAddBreadModalOpen(true)}
              className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-lg border-2 border-dashed border-primary/40 bg-primary-light/15 hover:bg-primary-light/30 hover:border-primary text-primary transition-all text-center min-h-[110px] active:scale-[0.98] group"
            >
              <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <PlusCircle className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-xs text-foreground group-hover:text-primary">
                + Add Custom Bread
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Sardine, Agege, etc.
              </span>
            </button>
          </div>
        </div>

        {/* Right Side: Order Summary & Fast Numeric Entry (5 cols on Desktop) */}
        <div ref={orderSectionRef} className="lg:col-span-5">
          <Card className="sticky top-18 shadow-md">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Order Register</CardTitle>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-destructive hover:underline font-semibold"
                  >
                    Clear Order
                  </button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs">Cart is empty. Tap any available bread to add.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    if (!product) return null;
                    const maxStock = product.currentStock;

                    return (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between py-2 border-b border-border text-xs gap-2"
                      >
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="font-bold text-foreground truncate">{product.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatCurrency(product.unitPrice)} each • <span className="text-emerald-700 font-semibold">{maxStock} in stock</span>
                          </div>
                        </div>

                        {/* Numeric Input & Step Buttons for Fast Operation */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="h-8 w-8 rounded bg-muted flex items-center justify-center text-foreground hover:bg-border active:scale-95 text-xs font-bold shrink-0"
                            title="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>

                          {/* Fast Direct Typing Box (e.g., 50, 100, 500 pcs) */}
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max={maxStock}
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => setDirectQuantity(item.productId, e.target.value)}
                              onBlur={() => handleBlurQuantity(item.productId)}
                              className="w-14 sm:w-16 h-8 text-center font-extrabold text-xs rounded border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                              title="Type any bulk amount directly"
                              placeholder="0"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, 1)}
                            disabled={item.quantity >= maxStock}
                            className={`h-8 w-8 rounded flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                              item.quantity >= maxStock
                                ? 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                                : 'bg-muted text-foreground hover:bg-border active:scale-95'
                            }`}
                            title={item.quantity >= maxStock ? 'Max available stock reached' : 'Increase quantity'}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>

                          <span className="font-extrabold text-right w-16 text-foreground text-xs">
                            {formatCurrency(product.unitPrice * (item.quantity || 0))}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1 text-muted-foreground hover:text-destructive shrink-0"
                            title="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment Section */}
              {cart.length > 0 && (
                <form onSubmit={handleSubmitSale} className="space-y-3.5 pt-2 border-t border-border">
                  {/* Totals Summary */}
                  <div className="space-y-1.5 bg-muted/40 p-3 rounded-lg border border-border">
                    <div className="flex justify-between text-sm font-bold text-foreground">
                      <span>Total Amount ({totalQuantity} loaves):</span>
                      <span className="text-base text-primary font-extrabold">{formatCurrency(totalAmount)}</span>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Amount Received:</span>
                      <span className="font-semibold text-success">
                        {formatCurrency(numericPaidAmount)}
                      </span>
                    </div>

                    {balanceDue > 0 && (
                      <div className="flex justify-between text-xs pt-1 border-t border-border font-bold text-destructive">
                        <span>Balance Due (Debtor):</span>
                        <span>{formatCurrency(balanceDue)}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Payment Channel
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'cash', label: 'Cash', icon: <Banknote className="h-3.5 w-3.5" /> },
                        { id: 'transfer', label: 'Transfer', icon: <Smartphone className="h-3.5 w-3.5" /> },
                        { id: 'pos', label: 'POS', icon: <CreditCard className="h-3.5 w-3.5" /> },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-bold border transition-all ${
                            paymentMethod === m.id
                              ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                              : 'border-border bg-surface text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {m.icon}
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Paid & Quick Fill Buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-foreground">
                        Amount Paid (₦)
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleFullPayment}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Full Paid
                        </button>
                        <span className="text-muted-foreground text-[10px]">•</span>
                        <button
                          type="button"
                          onClick={handleZeroPayment}
                          className="text-[10px] font-bold text-destructive hover:underline"
                        >
                          Full Credit
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder={totalAmount.toString()}
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Optional Notes */}
                  <div>
                    <input
                      type="text"
                      placeholder="Invoice notes / payment reference (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Submit Sale Action */}
                  <Button
                    type="submit"
                    className="w-full h-11 gap-2 text-sm font-bold shadow-md bg-primary hover:bg-primary/95 text-primary-foreground"
                    disabled={totalQuantity === 0}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm Sale & Print</span>
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Mobile Checkout Summary Bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-14 left-0 right-0 p-3 bg-surface border-t border-border shadow-2xl z-30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                {totalQuantity} loaves selected
              </div>
              <div className="text-base font-black text-primary">
                {formatCurrency(totalAmount)}
              </div>
            </div>
            <Button size="sm" onClick={scrollToCheckout} className="gap-1.5 shadow-md">
              <span>Checkout Order</span>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Post-Sale Action Modal / Quick Access (Only when neither receipt nor invoice modal is open) */}
      {completedSale && !showReceipt && !showInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 no-print">
          <div className="bg-surface rounded-xl border border-border p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="h-12 w-12 rounded-full bg-success-light text-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Sale Recorded Successfully!</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receipt {completedSale.receiptNumber} • {formatCurrency(completedSale.totalAmount)}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                className="w-full gap-2 text-xs"
                onClick={() => {
                  setShowInvoice(true);
                  setShowReceipt(false);
                }}
              >
                <FileText className="h-4 w-4" />
                <span>Print Official Invoice (A4)</span>
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-xs"
                onClick={() => {
                  setShowReceipt(true);
                  setShowInvoice(false);
                }}
              >
                <Receipt className="h-4 w-4" />
                <span>Print Thermal Receipt (58/80mm)</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => setCompletedSale(null)}
              >
                Done / Next Sale
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Official Invoice Modal */}
      <InvoiceModal
        sale={completedSale}
        isOpen={showInvoice}
        onClose={() => {
          setShowInvoice(false);
          setCompletedSale(null);
        }}
      />

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        sale={completedSale}
        isOpen={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          setCompletedSale(null);
        }}
      />

      {/* Store Owner Custom Bread Variety Modal */}
      <AddProductModal
        isOpen={isAddBreadModalOpen}
        onClose={() => setIsAddBreadModalOpen(false)}
      />
    </div>
  );
};
