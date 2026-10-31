import React, { useState, useMemo } from 'react';
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
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Package,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ExcelJS from 'exceljs';

type DateFilterOption = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

export const SalesListPage: React.FC = () => {
  const { sales, recordPayment } = useStore();

  // Filters state
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'partial' | 'credit'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'cash' | 'transfer' | 'pos'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination for heavy-usage transaction volume
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  // Modals state
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<Sale | null>(null);
  const [saleForSettlement, setSaleForSettlement] = useState<Sale | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayMethod, setRepayMethod] = useState<PaymentMethod>('transfer');
  const [repayNote, setRepayNote] = useState<string>('');

  // Date boundary calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);
  const weekAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }, []);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  const handleSelectDateFilter = (option: DateFilterOption) => {
    setDateFilter(option);
    if (option === 'custom') {
      if (!customStartDate) setCustomStartDate(weekAgoStr);
      if (!customEndDate) setCustomEndDate(todayStr);
    }
  };

  // Filtered sales calculation
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const saleDate = s.createdAt ? s.createdAt.split('T')[0] : '';

      // 1. Date Filter
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = saleDate === todayStr;
      } else if (dateFilter === 'yesterday') {
        matchesDate = saleDate === yesterdayStr;
      } else if (dateFilter === 'week') {
        matchesDate = saleDate >= weekAgoStr;
      } else if (dateFilter === 'month') {
        matchesDate = saleDate.startsWith(currentMonthStr);
      } else if (dateFilter === 'custom') {
        if (customStartDate && saleDate < customStartDate) matchesDate = false;
        if (customEndDate && saleDate > customEndDate) matchesDate = false;
      }

      // 2. Payment Status Filter
      const matchesStatus = filterStatus === 'all' || s.paymentStatus === filterStatus;

      // 3. Payment Channel Filter
      const matchesChannel = channelFilter === 'all' || s.paymentMethod === channelFilter;

      // 4. Search Filter
      const matchesSearch =
        !searchQuery ||
        s.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDate && matchesStatus && matchesChannel && matchesSearch;
    });
  }, [
    sales,
    dateFilter,
    todayStr,
    yesterdayStr,
    weekAgoStr,
    currentMonthStr,
    customStartDate,
    customEndDate,
    filterStatus,
    channelFilter,
    searchQuery,
  ]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, filterStatus, channelFilter, searchQuery, customStartDate, customEndDate]);

  // Live KPI Summary Metrics computed over the active filtered slice
  const summaryMetrics = useMemo(() => {
    const totalGross = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalPaid = filteredSales.reduce((acc, s) => acc + s.paidAmount, 0);
    const totalDebt = filteredSales.reduce((acc, s) => acc + s.balanceAmount, 0);
    const cashTotal = filteredSales
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((acc, s) => acc + s.paidAmount, 0);
    const transferTotal = filteredSales
      .filter((s) => s.paymentMethod === 'transfer')
      .reduce((acc, s) => acc + s.paidAmount, 0);
    const posTotal = filteredSales
      .filter((s) => s.paymentMethod === 'pos')
      .reduce((acc, s) => acc + s.paidAmount, 0);
    const totalLoaves = filteredSales.reduce(
      (acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0),
      0
    );

    return {
      count: filteredSales.length,
      totalGross,
      totalPaid,
      totalDebt,
      cashTotal,
      transferTotal,
      posTotal,
      totalLoaves,
    };
  }, [filteredSales]);

  // Pagination slice
  const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage, pageSize]);

  // Export Filtered Slice to Excel
  const handleExportFilteredExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BMS v0.1';
    workbook.created = new Date();

    const labelMap: Record<DateFilterOption, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      week: 'This_Week',
      month: 'This_Month',
      all: 'Full_History',
      custom: 'Custom_Period',
    };

    const sheetName = `Sales_${labelMap[dateFilter]}`;
    const sheet = workbook.addWorksheet(sheetName.substring(0, 31));

    sheet.columns = [
      { header: 'Receipt No', key: 'receiptNumber', width: 18 },
      { header: 'Date & Time', key: 'date', width: 22 },
      { header: 'Customer / Debtor', key: 'customer', width: 28 },
      { header: 'Loaves Sold', key: 'loaves', width: 14 },
      { header: 'Gross Sale (NGN)', key: 'total', width: 18 },
      { header: 'Amount Paid (NGN)', key: 'paid', width: 18 },
      { header: 'Balance Due (NGN)', key: 'balance', width: 18 },
      { header: 'Payment Method', key: 'method', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Cashier / Staff', key: 'cashier', width: 20 },
      { header: 'Notes / Reference', key: 'notes', width: 30 },
    ];

    filteredSales.forEach((s) => {
      const loavesCount = s.items.reduce((sum, i) => sum + i.quantity, 0);
      sheet.addRow({
        receiptNumber: s.receiptNumber,
        date: formatDateTime(s.createdAt),
        customer: s.customerName,
        loaves: loavesCount,
        total: s.totalAmount,
        paid: s.paidAmount,
        balance: s.balanceAmount,
        method: s.paymentMethod.toUpperCase(),
        status: s.paymentStatus.toUpperCase(),
        cashier: s.recordedBy,
        notes: s.notes || '',
      });
    });

    // Formatting Header Row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BMS_Sales_Report_${labelMap[dateFilter]}_${todayStr}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
      {/* Top Banner & Header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Sales & Invoices Ledger
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Filter high-volume transactions by day, week, or channel, audit debtor balances, and export spreadsheets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportFilteredExcel}
              className="gap-1.5 shadow-xs text-xs"
              title="Export currently filtered sales to Excel"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>Export Filtered (Excel)</span>
            </Button>
            <Link to="/sales/new">
              <Button size="sm" className="gap-1.5 shadow-sm text-xs">
                <PlusCircle className="h-4 w-4" />
                <span>New Sale (POS)</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Date Filter Bar: Today, Yesterday, This Week, This Month, All, Custom */}
      <Card className="p-3 sm:p-4 space-y-3">
        {/* Row 1: Timeframe Selection Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Calendar className="h-4 w-4 text-primary shrink-0 mr-1" />
            <span className="text-xs font-bold text-foreground mr-1 hidden xs:inline">Period:</span>
            {[
              { id: 'today', label: "Today's Report" },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'This Week (7D)' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom Range' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectDateFilter(t.id as DateFilterOption)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap min-h-[30px] ${
                  dateFilter === t.id
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'bg-muted text-muted-foreground hover:bg-border active:scale-95'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs with Explicit Mobile Labels and Presets */}
          {dateFilter === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
              <div className="flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-lg border border-border shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span>From:</span>
                </span>
                <input
                  type="date"
                  value={customStartDate || weekAgoStr}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-7 px-1.5 rounded bg-muted/40 border border-border/80 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
                  aria-label="Start date"
                />
              </div>

              <span className="text-muted-foreground text-xs font-bold hidden xs:inline">to</span>

              <div className="flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-lg border border-border shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span>To:</span>
                </span>
                <input
                  type="date"
                  value={customEndDate || todayStr}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-7 px-1.5 rounded bg-muted/40 border border-border/80 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
                  aria-label="End date"
                />
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Search + Status + Payment Channel */}
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Search Box - Unified Full-Width Input with Full Orange Hover & Focus Coverage */}
          <div className="relative flex-1 w-full max-w-md">
            <input
              type="text"
              placeholder="Search Crown, Big House, receipt #..."
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

          {/* Status & Channel Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Picker */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
              {[
                { id: 'all', label: 'All Status' },
                { id: 'paid', label: 'Settled' },
                { id: 'partial', label: 'Debtors' },
                { id: 'credit', label: 'Credit' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFilterStatus(s.id as any)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    filterStatus === s.id
                      ? 'bg-surface text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Channel Picker */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
              {[
                { id: 'all', label: 'All Channels' },
                { id: 'cash', label: 'Cash' },
                { id: 'transfer', label: 'Transfer' },
                { id: 'pos', label: 'POS' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChannelFilter(c.id as any)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    channelFilter === c.id
                      ? 'bg-surface text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Live Operational KPI Summary Bar (Dynamically Updates with Date Filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <div className="p-3 rounded-lg bg-surface border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
            Transactions
          </span>
          <span className="font-extrabold text-base text-foreground mt-0.5 block">
            {summaryMetrics.count} sales
          </span>
          <span className="text-[10px] text-muted-foreground">
            {summaryMetrics.totalLoaves} loaves sold
          </span>
        </div>

        <div className="p-3 rounded-lg bg-surface border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
            Gross Sales Value
          </span>
          <span className="font-extrabold text-base text-foreground mt-0.5 block">
            {formatCurrency(summaryMetrics.totalGross)}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {formatCurrency(summaryMetrics.totalPaid)} collected
          </span>
        </div>

        <div className="p-3 rounded-lg bg-surface border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
            Cash Remitted
          </span>
          <span className="font-extrabold text-base text-foreground mt-0.5 block">
            {formatCurrency(summaryMetrics.cashTotal)}
          </span>
          <span className="text-[10px] text-muted-foreground">Drawer currency</span>
        </div>

        <div className="p-3 rounded-lg bg-surface border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
            Bank Transfer In
          </span>
          <span className="font-extrabold text-base text-blue-700 mt-0.5 block">
            {formatCurrency(summaryMetrics.transferTotal)}
          </span>
          <span className="text-[10px] text-muted-foreground">Verified credits</span>
        </div>

        <div className="p-3 rounded-lg bg-surface border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
            Card POS Machine
          </span>
          <span className="font-extrabold text-base text-purple-700 mt-0.5 block">
            {formatCurrency(summaryMetrics.posTotal)}
          </span>
          <span className="text-[10px] text-muted-foreground">Terminal slips</span>
        </div>

        <div className="p-3 rounded-lg bg-surface border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
            Unpaid Debt Created
          </span>
          <span
            className={`font-extrabold text-base mt-0.5 block ${
              summaryMetrics.totalDebt > 0 ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {formatCurrency(summaryMetrics.totalDebt)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {summaryMetrics.totalDebt > 0 ? 'To be recovered' : 'Zero debt created'}
          </span>
        </div>
      </div>

      {/* Sales Content: Desktop Table + Mobile Cards */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Receipt / Time</th>
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
                {paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No sales records matching your selected date or filters.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{sale.receiptNumber}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTime(sale.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {sale.customerName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="truncate max-w-[200px] block">
                          {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        {formatCurrency(sale.paidAmount)}
                        <span className="text-[9px] text-muted-foreground block uppercase">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span className={sale.balanceAmount > 0 ? 'text-red-600' : 'text-muted-foreground'}>
                          {formatCurrency(sale.balanceAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PaymentBadge status={sale.paymentStatus} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sale.balanceAmount > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRepayModal(sale)}
                              className="h-7 px-2 text-[11px] font-bold text-primary border-primary/40 bg-primary-light/30 hover:bg-primary-light"
                            >
                              Settle
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSaleForReceipt(sale)}
                            className="h-7 w-7 p-0"
                            title="Print Thermal Slip (58/80mm)"
                          >
                            <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSaleForInvoice(sale)}
                            className="h-7 w-7 p-0"
                            title="Print Official A4 Invoice"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="sm:hidden divide-y divide-border">
            {paginatedSales.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No sales records found for this period.
              </div>
            ) : (
              paginatedSales.map((sale) => (
                <div key={sale.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-foreground">{sale.receiptNumber}</div>
                      <div className="text-xs font-semibold text-primary">{sale.customerName}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDateTime(sale.createdAt)}
                      </div>
                    </div>
                    <PaymentBadge status={sale.paymentStatus} />
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Total:</span>{' '}
                      <span className="font-bold text-foreground">
                        {formatCurrency(sale.totalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Paid:</span>{' '}
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(sale.paidAmount)}
                      </span>
                    </div>
                    {sale.balanceAmount > 0 && (
                      <div>
                        <span className="text-[10px] text-muted-foreground">Owes:</span>{' '}
                        <span className="font-bold text-red-600">
                          {formatCurrency(sale.balanceAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {sale.balanceAmount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRepayModal(sale)}
                        className="h-7 text-xs font-bold text-primary border-primary/40"
                      >
                        Settle Balance
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSaleForReceipt(sale)}
                      className="h-7 text-xs gap-1"
                    >
                      <Receipt className="h-3 w-3" />
                      <span>Slip</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSaleForInvoice(sale)}
                      className="h-7 text-xs gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      <span>A4</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>

        {/* Pagination Controls for High-Volume Data */}
        {filteredSales.length > pageSize && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing{' '}
              <strong>
                {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filteredSales.length)}
              </strong>{' '}
              of <strong>{filteredSales.length}</strong> transactions
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2 gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Prev</span>
              </Button>
              <span className="px-2 font-bold text-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2 gap-1"
              >
                <span className="hidden xs:inline">Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Settle Balance Modal */}
      {saleForSettlement && (
        <Modal
          isOpen={true}
          onClose={() => setSaleForSettlement(null)}
          title={`Settle Balance: ${saleForSettlement.receiptNumber}`}
          description={`Customer: ${saleForSettlement.customerName} • Outstanding: ${formatCurrency(
            saleForSettlement.balanceAmount
          )}`}
          maxWidth="sm"
        >
          <form onSubmit={handleSubmitRepayment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Amount to Collect (NGN) *
              </label>
              <input
                type="number"
                min="1"
                max={saleForSettlement.balanceAmount}
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Cash' },
                  { id: 'transfer', label: 'Transfer' },
                  { id: 'pos', label: 'POS' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setRepayMethod(m.id as PaymentMethod)}
                    className={`py-2 text-xs font-semibold rounded-md border transition-all ${
                      repayMethod === m.id
                        ? 'border-primary bg-primary-light text-primary font-bold'
                        : 'border-border bg-surface text-muted-foreground'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Reference / Receipt Note
              </label>
              <input
                type="text"
                placeholder="e.g. Bank transfer ref, cash collected at counter"
                value={repayNote}
                onChange={(e) => setRepayNote(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSaleForSettlement(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Confirm Settlement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Official Invoice Modal */}
      <InvoiceModal
        sale={selectedSaleForInvoice}
        isOpen={!!selectedSaleForInvoice}
        onClose={() => setSelectedSaleForInvoice(null)}
      />

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        sale={selectedSaleForReceipt}
        isOpen={!!selectedSaleForReceipt}
        onClose={() => setSelectedSaleForReceipt(null)}
      />
    </div>
  );
};
