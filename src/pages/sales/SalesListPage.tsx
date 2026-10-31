import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PaymentBadge, SyncBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ReceiptModal } from '../../components/printing/ReceiptModal';
import { InvoiceModal } from '../../components/printing/InvoiceModal';
import { Sale, PaymentMethod } from '../../types/domain.types';
import {
  Receipt,
  FileText,
  PlusCircle,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SalesListPage: React.FC = () => {
  const { sales, recordPayment } = useStore();

  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'partial' | 'credit'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<Sale | null>(null);

  // Settlement modal state
  const [saleForSettlement, setSaleForSettlement] = useState<Sale | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayMethod, setRepayMethod] = useState<PaymentMethod>('transfer');
  const [repayNote, setRepayNote] = useState<string>('');

  const filteredSales = sales.filter((s) => {
    const matchesFilter = filterStatus === 'all' || s.paymentStatus === filterStatus;
    const matchesSearch =
      s.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenRepayModal = (sale: Sale) => {
    setSaleForSettlement(sale);
    setRepayAmount(sale.balanceAmount.toString());
    setRepayNote(`Settlement for ${sale.receiptNumber}`);
  };

  const handleSubmitRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForSettlement) return;

    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0) return;

    recordPayment({
      saleId: saleForSettlement.id,
      amount,
      paymentMethod: repayMethod,
      referenceNote: repayNote,
    });

    setSaleForSettlement(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Staff Guidance */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Sales & Invoices Ledger
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Audit daily receipts, settle debtor accounts (Crown, Big House), and print invoices.
            </p>
          </div>
          <Link to="/sales/new">
            <Button size="sm" className="gap-1.5 shadow-sm text-xs">
              <PlusCircle className="h-4 w-4" />
              <span>New Sale (POS)</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900">
          <span className="font-bold px-1.5 py-0.5 rounded bg-blue-200/60 text-blue-950 shrink-0 uppercase text-[9px]">
            Staff Rule
          </span>
          <span className="leading-tight">
            To record a balance payment from a debtor, click <strong>"Settle"</strong> on their original invoice below. Do not create a new product sale to receive debt payments.
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search Crown, Big House, receipt #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-3 pl-9 pr-8 rounded-md border border-border bg-surface text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Pills with Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline shrink-0" />
            {[
              { id: 'all', label: 'All Sales', count: sales.length },
              {
                id: 'partial',
                label: 'Debtors / Partial',
                count: sales.filter((s) => s.paymentStatus === 'partial').length,
              },
              {
                id: 'credit',
                label: 'Full Credit',
                count: sales.filter((s) => s.paymentStatus === 'credit').length,
              },
              {
                id: 'paid',
                label: 'Settled',
                count: sales.filter((s) => s.paymentStatus === 'paid').length,
              },
            ].map((f) => {
              const isSelected = filterStatus === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id as any)}
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

      {/* Sales Content: Desktop Table + Mobile Cards */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Invoice / Time</th>
                  <th className="px-4 py-3">Customer / Debtor</th>
                  <th className="px-4 py-3">Items Summary</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No sales records matching your search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">{sale.receiptNumber}</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTime(sale.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{sale.customerName}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Cashier: {sale.recordedBy}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-muted-foreground max-w-[180px] truncate">
                          {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-success font-semibold">
                        {formatCurrency(sale.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            sale.balanceAmount > 0
                              ? 'text-destructive font-bold'
                              : 'text-muted-foreground'
                          }
                        >
                          {formatCurrency(sale.balanceAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <PaymentBadge status={sale.paymentStatus} />
                          <SyncBadge status={sale.syncStatus} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sale.balanceAmount > 0 && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenRepayModal(sale)}
                              className="h-7 text-xs px-2 gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                              title="Settle balance on this exact transaction"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Settle</span>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSaleForInvoice(sale)}
                            className="h-7 text-xs px-2 gap-1 text-primary border-primary/30"
                            title="Print Formal Invoice"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Invoice</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSaleForReceipt(sale)}
                            className="h-7 text-xs px-2 gap-1"
                            title="Print Thermal Receipt"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            <span>Receipt</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< sm) */}
          <div className="block sm:hidden divide-y divide-border">
            {filteredSales.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No sales records matching your search or filter.
              </div>
            ) : (
              filteredSales.map((sale) => (
                <div key={sale.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-foreground">{sale.customerName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {sale.receiptNumber} • {formatDateTime(sale.createdAt)}
                      </div>
                    </div>
                    <PaymentBadge status={sale.paymentStatus} />
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded space-y-1">
                    <div className="flex justify-between">
                      <span>Total Sale:</span>
                      <span className="font-bold text-foreground">{formatCurrency(sale.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid:</span>
                      <span className="font-semibold text-success">{formatCurrency(sale.paidAmount)}</span>
                    </div>
                    {sale.balanceAmount > 0 && (
                      <div className="flex justify-between font-bold text-destructive pt-1 border-t border-border">
                        <span>Balance Owed:</span>
                        <span>{formatCurrency(sale.balanceAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {sale.balanceAmount > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenRepayModal(sale)}
                        className="h-8 text-xs flex-1 gap-1 bg-amber-600 text-white hover:bg-amber-700"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Settle Debt</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSaleForInvoice(sale)}
                      className="h-8 text-xs flex-1 gap-1 text-primary border-primary/30"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Invoice</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSaleForReceipt(sale)}
                      className="h-8 text-xs flex-1 gap-1"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      <span>Receipt</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Partial Payment / Debt Settlement Modal */}
      <Modal
        isOpen={!!saleForSettlement}
        onClose={() => setSaleForSettlement(null)}
        title="Record Debt Repayment"
        description={
          saleForSettlement
            ? `Direct settlement for ${saleForSettlement.receiptNumber} (${saleForSettlement.customerName})`
            : ''
        }
      >
        {saleForSettlement && (
          <form onSubmit={handleSubmitRepayment} className="space-y-4">
            <div className="bg-muted/40 p-3 rounded-lg border border-border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Invoice Total:</span>
                <span className="font-semibold">{formatCurrency(saleForSettlement.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previously Paid:</span>
                <span className="font-semibold text-success">
                  {formatCurrency(saleForSettlement.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border font-bold">
                <span className="text-destructive">Remaining Balance Owed:</span>
                <span className="text-destructive text-sm">
                  {formatCurrency(saleForSettlement.balanceAmount)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Repayment Amount (₦)
              </label>
              <input
                type="number"
                min="1"
                max={saleForSettlement.balanceAmount}
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'transfer', 'pos'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setRepayMethod(m)}
                    className={`py-2 px-2 rounded-md border text-xs font-semibold capitalize transition-all ${
                      repayMethod === m
                        ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                        : 'border-border bg-surface text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Payment Note / Bank Reference
              </label>
              <input
                type="text"
                value={repayNote}
                onChange={(e) => setRepayNote(e.target.value)}
                placeholder="e.g. Zenith bank transfer reference"
                className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSaleForSettlement(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Repayment</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Commercial Invoice Modal */}
      <InvoiceModal
        sale={selectedSaleForInvoice}
        isOpen={!!selectedSaleForInvoice}
        onClose={() => setSelectedSaleForInvoice(null)}
      />

      {/* Branded Receipt Modal */}
      <ReceiptModal
        sale={selectedSaleForReceipt}
        isOpen={!!selectedSaleForReceipt}
        onClose={() => setSelectedSaleForReceipt(null)}
      />
    </div>
  );
};
