import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ReceiptModal } from '../../components/printing/ReceiptModal';
import { Customer, Sale, PaymentMethod } from '../../types/domain.types';
import {
  PlusCircle,
  Phone,
  AlertCircle,
  CheckCircle2,
  Search,
  Building2,
  X,
  Filter,
  Users,
  Banknote,
  FileText,
  Receipt,
  Share2,
  Calendar,
  CreditCard,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomersPage: React.FC = () => {
  const { customers, addCustomer, sales, recordPayment } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debtFilter, setDebtFilter] = useState<'all' | 'debtors' | 'settled'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerNotes, setNewCustomerNotes] = useState('');

  // Settlement & Statement Modal State
  const [settlementCustomer, setSettlementCustomer] = useState<Customer | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Printing modal for payment receipt
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDebt =
      debtFilter === 'all'
        ? true
        : debtFilter === 'debtors'
        ? c.currentDebt > 0
        : c.currentDebt === 0;
    return matchesSearch && matchesDebt;
  });

  const totalOutstandingDebt = customers.reduce((sum, c) => sum + c.currentDebt, 0);
  const activeDebtorsCount = customers.filter((c) => c.currentDebt > 0).length;

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName) return;
    addCustomer(newCustomerName, newCustomerPhone, newCustomerNotes);
    setIsAddModalOpen(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerNotes('');
  };

  // Open Settlement Modal
  const openSettlementModal = (cust: Customer) => {
    setSettlementCustomer(cust);
    setPaymentSuccessMsg(null);
    setPaymentNote('');

    // Find unpaid sales for this customer
    const unpaidSales = sales.filter(
      (s) => s.customerId === cust.id && s.balanceAmount > 0
    );

    if (unpaidSales.length > 0) {
      setSelectedSaleId(unpaidSales[0].id);
      setPaymentAmount(String(unpaidSales[0].balanceAmount));
    } else {
      setSelectedSaleId('');
      setPaymentAmount('');
    }
  };

  // Handle Debt Payment Submission
  const handleRecordDebtPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementCustomer || !selectedSaleId) return;

    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    recordPayment({
      saleId: selectedSaleId,
      amount: parsedAmount,
      paymentMethod,
      referenceNote: paymentNote || `Settlement from ${settlementCustomer.name}`,
    });

    const targetSale = sales.find((s) => s.id === selectedSaleId);
    if (targetSale) {
      setReceiptSale(targetSale);
    }

    setPaymentSuccessMsg(`Payment of ${formatCurrency(parsedAmount)} recorded successfully!`);
    setTimeout(() => {
      setSettlementCustomer(null);
      setPaymentSuccessMsg(null);
    }, 1500);
  };

  // WhatsApp reminder generator
  const sendWhatsAppReminder = (cust: Customer) => {
    const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
    const msg = `Dear ${cust.name},\nThis is a friendly statement update from our Bakery Management office.\nYour current outstanding balance is ${formatCurrency(cust.currentDebt)}.\nPlease arrange for payment via cash or bank transfer at your earliest convenience.\nThank you for your business!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Unpaid sales for the customer currently in settlement modal
  const currentCustomerUnpaidSales = settlementCustomer
    ? sales.filter((s) => s.customerId === settlementCustomer.id && s.balanceAmount > 0)
    : [];

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Customers & Debtors Ledger
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Credit accounts for key distributors and retail buyers (Crown, Big House, etc.).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-1.5 shadow-sm text-xs">
            <PlusCircle className="h-4 w-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* Aggregate Overview Cards: 2 on a single row, Receivables featured to reduce scroll */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
        {/* Left Pair: Total Customer Accounts + Active Debtors side-by-side on a single row */}
        <div className="grid grid-cols-2 gap-2 sm:col-span-7">
          <Card className="p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">Customer Accounts</span>
              <Users className="h-4 w-4 text-muted-foreground/70" />
            </div>
            <div className="text-base sm:text-xl font-bold text-foreground mt-1">
              {customers.length} <span className="text-xs font-normal text-muted-foreground">total</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">All registered stores</span>
          </Card>

          <Card className="p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">Active Debtors</span>
              <AlertCircle className="h-4 w-4 text-destructive/70" />
            </div>
            <div className="text-base sm:text-xl font-bold text-destructive mt-1">
              {activeDebtorsCount} <span className="text-xs font-normal text-destructive/70">unpaid</span>
            </div>
            <span className="text-[10px] text-destructive/80 mt-0.5">With pending balance</span>
          </Card>
        </div>

        {/* Right / Second: Total Receivables Owed as prominent figure */}
        <Card className="p-3 sm:p-4 sm:col-span-5 bg-destructive/5 border-destructive/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-destructive">Total Receivables Owed</span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">
              Due to Bakery
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-destructive mt-1">
            {formatCurrency(totalOutstandingDebt)}
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            Credit extended across retail distributors
          </span>
        </Card>
      </div>

      {/* Search and Debt Filter Pills */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <input
              type="text"
              placeholder="Search Crown, Big House, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9.5 px-3 pl-10 pr-9 rounded-xl border border-border bg-surface text-xs font-medium text-foreground placeholder:text-muted-foreground transition-all hover:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-xs"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills with Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline shrink-0" />
            {[
              { id: 'all', label: 'All Accounts', count: customers.length },
              {
                id: 'debtors',
                label: 'Active Debtors',
                count: activeDebtorsCount,
              },
              {
                id: 'settled',
                label: 'Zero Debt / Settled',
                count: customers.filter((c) => c.currentDebt === 0).length,
              },
            ].map((f) => {
              const isSelected = debtFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setDebtFilter(f.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap min-h-[32px] ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'bg-muted text-muted-foreground hover:bg-border active:scale-95'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-background/80 text-muted-foreground'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Customer List: Desktop Table + Mobile Cards */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Customer / Debtor</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Credit Terms & Notes</th>
                  <th className="px-4 py-3 text-right">Running Debt</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((cust) => {
                  const hasDebt = cust.currentDebt > 0;
                  const isSpecial = cust.name.includes('Crown') || cust.name.includes('Big House');
                  return (
                    <tr key={cust.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
                          {isSpecial && <Building2 className="h-4 w-4 text-primary shrink-0" />}
                          <span>{cust.name}</span>
                        </div>
                        {cust.id === 'cust-walkin' && (
                          <span className="text-[10px] text-muted-foreground">
                            Default register counter account
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{cust.phone || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-muted-foreground">
                          {cust.notes || 'Standard buyer'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-sm">
                        {hasDebt ? (
                          <span className="text-destructive font-bold">{formatCurrency(cust.currentDebt)}</span>
                        ) : (
                          <span className="text-success font-semibold">Settled (₦0.00)</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasDebt ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openSettlementModal(cust)}
                                className="h-7 text-xs px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
                              >
                                Settle Debt
                              </Button>
                              {cust.phone && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendWhatsAppReminder(cust)}
                                  className="h-7 text-xs px-2 text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                                  title="Send WhatsApp Debt Reminder"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openSettlementModal(cust)}
                              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                            >
                              Statement
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< sm) */}
          <div className="block sm:hidden divide-y divide-border">
            {filteredCustomers.map((cust) => {
              const hasDebt = cust.currentDebt > 0;
              const isSpecial = cust.name.includes('Crown') || cust.name.includes('Big House');
              return (
                <div key={cust.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                        {isSpecial && <Building2 className="h-4 w-4 text-primary shrink-0" />}
                        <span>{cust.name}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span>{cust.phone || 'No phone recorded'}</span>
                      </div>
                    </div>
                    {hasDebt ? (
                      <span className="text-xs font-bold text-destructive px-2 py-0.5 rounded bg-destructive-light shrink-0">
                        Owes {formatCurrency(cust.currentDebt)}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-success px-2 py-0.5 rounded bg-success-light shrink-0">
                        Settled
                      </span>
                    )}
                  </div>

                  {cust.notes && (
                    <p className="text-[11px] text-muted-foreground italic bg-muted/30 p-2 rounded">
                      {cust.notes}
                    </p>
                  )}

                  <div className="pt-1 flex items-center gap-2">
                    {hasDebt ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => openSettlementModal(cust)}
                          className="flex-1 h-8 text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs"
                        >
                          Settle Debt
                        </Button>
                        {cust.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendWhatsAppReminder(cust)}
                            className="h-8 px-2.5 text-xs text-emerald-800 border-emerald-300 bg-emerald-50"
                            title="Send WhatsApp Reminder"
                          >
                            <Share2 className="h-3.5 w-3.5 text-emerald-700" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSettlementModal(cust)}
                        className="w-full h-8 text-xs text-muted-foreground"
                      >
                        View Account History
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Customer Statement & Debt Settlement Modal */}
      <Modal
        isOpen={Boolean(settlementCustomer)}
        onClose={() => setSettlementCustomer(null)}
        title={settlementCustomer ? `${settlementCustomer.name} — Debt Settlement` : ''}
        description="Receive partial or full debt payment against customer credit invoices."
      >
        {settlementCustomer && (
          <div className="space-y-4">
            {/* Account Summary Banner */}
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-destructive">Current Running Debt</span>
                <div className="text-xl font-black text-destructive">
                  {formatCurrency(settlementCustomer.currentDebt)}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{settlementCustomer.phone || 'No phone'}</div>
                <div className="text-[10px]">{settlementCustomer.notes || 'Standard terms'}</div>
              </div>
            </div>

            {paymentSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            {/* Unpaid Invoices List */}
            {currentCustomerUnpaidSales.length > 0 ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">
                  Select Unpaid Sale to Settle ({currentCustomerUnpaidSales.length} pending):
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {currentCustomerUnpaidSales.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSaleId(s.id);
                        setPaymentAmount(String(s.balanceAmount));
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        selectedSaleId === s.id
                          ? 'border-primary bg-primary-light/40 shadow-xs ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <span>{s.receiptNumber}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({formatDateTime(s.createdAt)})
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Total: {formatCurrency(s.totalAmount)} • Paid: {formatCurrency(s.paidAmount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-destructive">
                          {formatCurrency(s.balanceAmount)}
                        </span>
                        <div className="text-[9px] uppercase font-bold text-amber-700">Owed</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Settlement Form */}
                <form onSubmit={handleRecordDebtPayment} className="space-y-3 pt-2 border-t border-border">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Amount to Pay (₦)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={
                          currentCustomerUnpaidSales.find((s) => s.id === selectedSaleId)?.balanceAmount ||
                          settlementCustomer.currentDebt
                        }
                        step="any"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Payment Channel
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full h-9 px-2 rounded-md border border-border bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="cash">Cash In Hand</option>
                        <option value="transfer">Bank Transfer</option>
                        <option value="pos">POS Terminal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Bank Ref / Teller / Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Zenith transfer ref #92841"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="w-full h-8 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSettlementCustomer(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="gap-1.5 font-bold shadow-xs">
                      <Banknote className="h-4 w-4" />
                      <span>Confirm & Deduct Debt</span>
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
                <div className="font-bold text-sm text-foreground">Zero Debt! Account Settled.</div>
                <p className="text-xs text-muted-foreground">
                  This customer does not have any unpaid credit sales currently on the ledger.
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettlementCustomer(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Customer"
        description="Add a retail shop, supermarket, or wholesale account."
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Customer or Business Name
            </label>
            <input
              type="text"
              placeholder="e.g. Crown Stores or Big House Wholesale"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+234 800 000 0000"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Credit Terms / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly settlement via bank transfer"
              value={newCustomerNotes}
              onChange={(e) => setNewCustomerNotes(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Save Customer</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Receipt Modal */}
      <ReceiptModal
        sale={receiptSale}
        isOpen={Boolean(receiptSale)}
        onClose={() => setReceiptSale(null)}
      />
    </div>
  );
};