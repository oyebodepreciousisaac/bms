import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PaymentBadge, SyncBadge } from '../../components/common/Badge';
import { ReceiptModal } from '../../components/printing/ReceiptModal';
import { InvoiceModal } from '../../components/printing/InvoiceModal';
import { ExcelImportModal } from '../../components/common/ExcelImportModal';
import { OperationsCharts } from '../../components/dashboard/OperationsCharts';
import { Sale } from '../../types/domain.types';
import {
  TrendingUp,
  Banknote,
  AlertTriangle,
  Package,
  PlusCircle,
  FileSpreadsheet,
  Upload,
  Receipt,
  FileText,
  Clock,
  ArrowRight,
  Users,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ExcelJS from 'exceljs';

export type DashboardPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export const DashboardPage: React.FC = () => {
  const { sales, products, rawMaterials, customers, productionBatches, allocations } = useStore();
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<Sale | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>('today');

  // Filter sales dynamically by selected period
  const periodSales = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOfWeek = startOfToday - 7 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter((s) => {
      const saleTime = new Date(s.createdAt).getTime();
      if (dashboardPeriod === 'today') return saleTime >= startOfToday;
      if (dashboardPeriod === 'yesterday') return saleTime >= startOfYesterday && saleTime < startOfToday;
      if (dashboardPeriod === 'week') return saleTime >= startOfWeek;
      if (dashboardPeriod === 'month') return saleTime >= startOfMonth;
      return true; // 'all'
    });
  }, [sales, dashboardPeriod]);

  // Operational aggregates for selected period
  const totalSales = periodSales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaid = periodSales.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalOutstanding = periodSales.reduce((acc, curr) => acc + curr.balanceAmount, 0);
  const totalUnitsSold = periodSales.reduce(
    (acc, curr) => acc + curr.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  // All-time receivables from debtor records
  const allTimeCustomerDebt = customers.reduce((acc, curr) => acc + curr.currentDebt, 0);
  const totalFinishedStock = products.reduce((acc, curr) => acc + curr.currentStock, 0);

  // Payment channel totals for overview chart in selected period
  const cashPaid = periodSales
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.paidAmount, 0);
  const transferPaid = periodSales
    .filter((s) => s.paymentMethod === 'transfer')
    .reduce((sum, s) => sum + s.paidAmount, 0);
  const posPaid = periodSales
    .filter((s) => s.paymentMethod === 'pos')
    .reduce((sum, s) => sum + s.paidAmount, 0);

  // Low stock products
  const lowStockItems = products.filter((p) => p.currentStock <= p.minStockAlert);
  const lowRawMaterials = rawMaterials.filter((rm) => rm.currentStock <= rm.minStockAlert);

  // Export comprehensive multi-sheet Excel report
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BMS v0.1';
    workbook.created = new Date();

    // 1. Sales Worksheet
    const salesSheet = workbook.addWorksheet('Daily Sales Register');
    salesSheet.columns = [
      { header: 'Receipt No', key: 'receiptNumber', width: 16 },
      { header: 'Date', key: 'date', width: 22 },
      { header: 'Customer / Debtor', key: 'customer', width: 28 },
      { header: 'Total (NGN)', key: 'total', width: 15 },
      { header: 'Paid (NGN)', key: 'paid', width: 15 },
      { header: 'Balance (NGN)', key: 'balance', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Method', key: 'method', width: 12 },
      { header: 'Staff', key: 'cashier', width: 20 },
    ];

    sales.forEach((s) => {
      salesSheet.addRow({
        receiptNumber: s.receiptNumber,
        date: formatDateTime(s.createdAt),
        customer: s.customerName,
        total: s.totalAmount,
        paid: s.paidAmount,
        balance: s.balanceAmount,
        status: s.paymentStatus.toUpperCase(),
        method: s.paymentMethod.toUpperCase(),
        cashier: s.recordedBy,
      });
    });
    salesSheet.getRow(1).font = { bold: true };

    // 2. Debtors Worksheet
    const debtorSheet = workbook.addWorksheet('Debtors & Receivables');
    debtorSheet.columns = [
      { header: 'Account / Business Name', key: 'name', width: 30 },
      { header: 'Phone Number', key: 'phone', width: 18 },
      { header: 'Outstanding Debt (NGN)', key: 'debt', width: 24 },
      { header: 'Account Notes', key: 'notes', width: 35 },
    ];

    customers
      .filter((c) => c.currentDebt > 0)
      .forEach((c) => {
        debtorSheet.addRow({
          name: c.name,
          phone: c.phone || 'N/A',
          debt: c.currentDebt,
          notes: c.notes || '—',
        });
      });
    debtorSheet.getRow(1).font = { bold: true };

    // 3. Finished Goods Worksheet
    const stockSheet = workbook.addWorksheet('Finished Goods');
    stockSheet.columns = [
      { header: 'Bread Variety', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Unit Price (NGN)', key: 'price', width: 18 },
      { header: 'Current Stock (Loaves)', key: 'stock', width: 22 },
      { header: 'Inventory Value (NGN)', key: 'val', width: 22 },
      { header: 'Alert Threshold', key: 'alert', width: 16 },
    ];

    products.forEach((p) => {
      stockSheet.addRow({
        name: p.name,
        category: p.category,
        price: p.unitPrice,
        stock: p.currentStock,
        val: p.unitPrice * p.currentStock,
        alert: p.minStockAlert,
      });
    });
    stockSheet.getRow(1).font = { bold: true };

    // 4. Raw Materials Worksheet
    const rmSheet = workbook.addWorksheet('Raw Materials Store');
    rmSheet.columns = [
      { header: 'Ingredient Name', key: 'name', width: 30 },
      { header: 'Unit of Measure', key: 'unit', width: 16 },
      { header: 'Current Physical Stock', key: 'stock', width: 24 },
      { header: 'Reorder Alert', key: 'alert', width: 16 },
    ];

    rawMaterials.forEach((rm) => {
      rmSheet.addRow({
        name: rm.name,
        unit: rm.unitOfMeasure,
        stock: rm.currentStock,
        alert: rm.minStockAlert,
      });
    });
    rmSheet.getRow(1).font = { bold: true };

    // 5. Bakehouse Production Worksheet
    const prodSheet = workbook.addWorksheet('Bakehouse Logs');
    prodSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Bread Variety', key: 'name', width: 28 },
      { header: 'Total Loaves Baked', key: 'baked', width: 20 },
      { header: 'Damaged Loaves', key: 'damaged', width: 18 },
      { header: 'Net Usable Added', key: 'net', width: 18 },
      { header: 'Supervisor', key: 'supervisor', width: 20 },
    ];

    productionBatches.forEach((b) => {
      prodSheet.addRow({
        date: b.batchDate,
        name: b.productName,
        baked: b.quantityProduced,
        damaged: b.quantityDamaged,
        net: b.netUsable,
        supervisor: b.recordedBy,
      });
    });
    prodSheet.getRow(1).font = { bold: true };

    // 6. Distributor Routes Worksheet
    const distSheet = workbook.addWorksheet('Distributor Routes');
    distSheet.columns = [
      { header: 'Distributor / Route', key: 'name', width: 30 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Allocated Value (NGN)', key: 'val', width: 22 },
      { header: 'Collections Reported (NGN)', key: 'collected', width: 25 },
      { header: 'Route Coverage', key: 'notes', width: 35 },
    ];

    allocations.forEach((a) => {
      distSheet.addRow({
        name: a.distributorName,
        date: a.allocationDate,
        status: a.status.toUpperCase(),
        val: a.totalAllocatedValue,
        collected: a.totalCollectedValue,
        notes: a.notes || '—',
      });
    });
    distSheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `BMS_Comprehensive_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const periodLabels: Record<DashboardPeriod, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    week: 'Past 7 Days',
    month: 'This Month',
    all: 'All Time',
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            BMS Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time bakery register: revenue, payments, debtor balances, and stock.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} className="gap-1.5 text-xs text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100">
            <Upload className="h-3.5 w-3.5 text-emerald-700" />
            <span>Import Excel</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 text-xs">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="hidden xs:inline">Export</span> Excel
          </Button>
          <Link to="/sales/new">
            <Button size="sm" className="gap-1.5 text-xs shadow-sm">
              <PlusCircle className="h-4 w-4" />
              <span>New Sale</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Period Selector for Busy Heavy-Volume Bakeries */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-xl bg-card border border-border/80 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-1">
          <Calendar className="h-4 w-4 text-primary" />
          <span>Operational Period:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60">
          {(['today', 'yesterday', 'week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDashboardPeriod(period)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                dashboardPeriod === period
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/70'
              }`}
            >
              {period === 'today' && 'Today'}
              {period === 'yesterday' && 'Yesterday'}
              {period === 'week' && 'Past 7 Days'}
              {period === 'month' && 'This Month'}
              {period === 'all' && 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid (Fluid & Mobile Optimized) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {periodLabels[dashboardPeriod]} Sales
            </span>
            <span className="p-1.5 sm:p-2 rounded-md bg-primary-light text-primary shrink-0">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-base sm:text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(totalSales)}
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {periodSales.length} {periodSales.length === 1 ? 'sale' : 'sales'} ({periodLabels[dashboardPeriod].toLowerCase()})
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground truncate">Cash & Remittance</span>
            <span className="p-1.5 sm:p-2 rounded-md bg-success-light text-success shrink-0">
              <Banknote className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-base sm:text-2xl font-bold tracking-tight text-success">
            {formatCurrency(totalPaid)}
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {Math.round((totalPaid / (totalSales || 1)) * 100)}% realization rate
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground truncate">Period Unpaid Balance</span>
            <span className="p-1.5 sm:p-2 rounded-md bg-destructive-light text-destructive shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-base sm:text-2xl font-bold tracking-tight text-destructive">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            Total ledger debt: {formatCurrency(allTimeCustomerDebt)}
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground truncate">Finished Stock</span>
            <span className="p-1.5 sm:p-2 rounded-md bg-amber-50 text-amber-700 shrink-0">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-base sm:text-2xl font-bold tracking-tight text-foreground">
            {totalFinishedStock.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {totalUnitsSold} loaves sold ({periodLabels[dashboardPeriod].toLowerCase()})
          </div>
        </Card>
      </div>

      {/* 2 Operations Charts: Cost/Revenue & Payment Progress */}
      <OperationsCharts
        sales={sales}
        totalSales={totalSales}
        totalPaid={totalPaid}
        totalOutstanding={totalOutstanding}
        cashPaid={cashPaid}
        transferPaid={transferPaid}
        posPaid={posPaid}
      />

      {/* Main Content Layout: Sales Table + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Sales Register (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent Sales & Invoices</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Latest activity with quick access to print invoices and receipts.
                </p>
              </div>
              <Link to="/sales">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {/* Desktop Table View (>= sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-y border-border text-muted-foreground uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Invoice / Date</th>
                      <th className="px-4 py-2.5">Customer</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                      <th className="px-4 py-2.5 text-right">Balance</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5 text-right">Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sales.slice(0, 5).map((sale) => (
                      <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{sale.receiptNumber}</div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>{formatDateTime(sale.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{sale.customerName}</div>
                          <div className="text-[10px] text-muted-foreground capitalize">
                            via {sale.paymentMethod} • {sale.recordedBy.split(' ')[0]}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={
                              sale.balanceAmount > 0 ? 'text-destructive font-bold' : 'text-muted-foreground'
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSaleForInvoice(sale)}
                              className="h-7 text-xs px-2 gap-1 text-primary border-primary/30 hover:bg-primary-light"
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (< sm) */}
              <div className="block sm:hidden divide-y divide-border">
                {sales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-foreground">{sale.customerName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {sale.receiptNumber} • {formatDateTime(sale.createdAt)}
                        </div>
                      </div>
                      <PaymentBadge status={sale.paymentStatus} />
                    </div>

                    <div className="flex items-center justify-between text-xs bg-muted/40 p-2 rounded">
                      <div>
                        <span className="text-muted-foreground">Total:</span>{' '}
                        <span className="font-bold text-foreground">{formatCurrency(sale.totalAmount)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Balance:</span>{' '}
                        <span className={sale.balanceAmount > 0 ? 'font-bold text-destructive' : 'font-semibold text-success'}>
                          {formatCurrency(sale.balanceAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSaleForInvoice(sale)}
                        className="h-8 text-xs flex-1 gap-1 text-primary border-primary/30"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Print Invoice</span>
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Workflows & Stock Alerts */}
        <div className="space-y-4">
          {/* Quick Workflows */}
          <Card className="p-4 bg-surface">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Daily Operations
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/sales/new"
                className="flex flex-col p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 transition-colors"
              >
                <PlusCircle className="h-5 w-5 text-primary mb-1.5" />
                <span className="font-semibold text-foreground">Touch POS</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Record sale</span>
              </Link>
              <Link
                to="/production"
                className="flex flex-col p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 transition-colors"
              >
                <Package className="h-5 w-5 text-amber-600 mb-1.5" />
                <span className="font-semibold text-foreground">Bakehouse</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Log loaves</span>
              </Link>
              <Link
                to="/customers"
                className="flex flex-col p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 transition-colors"
              >
                <Users className="h-5 w-5 text-blue-600 mb-1.5" />
                <span className="font-semibold text-foreground">Debtors</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Crown & others</span>
              </Link>
              <Link
                to="/distribution"
                className="flex flex-col p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 transition-colors"
              >
                <TrendingUp className="h-5 w-5 text-emerald-600 mb-1.5" />
                <span className="font-semibold text-foreground">Dispatch</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Route custody</span>
              </Link>
            </div>
          </Card>

          {/* Low Stock Warning Card */}
          <Card className="p-4 border-amber-200 bg-amber-50/40">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs mb-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Low Stock Alerts</span>
            </div>
            {lowStockItems.length === 0 && lowRawMaterials.length === 0 ? (
              <p className="text-xs text-muted-foreground">All inventory levels are currently healthy.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1 border-b border-amber-200/60">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-destructive font-bold text-xs">{item.currentStock} loaves left</span>
                  </div>
                ))}
                {lowRawMaterials.map((rm) => (
                  <div key={rm.id} className="flex justify-between items-center py-1">
                    <span className="font-medium text-foreground">{rm.name}</span>
                    <span className="text-amber-700 font-bold text-xs">{rm.currentStock} {rm.unitOfMeasure}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Excel Import Hub Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Commercial Invoice Modal */}
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
