import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { Modal } from './Modal';
import { Button } from './Button';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../lib/formatters';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Package,
  Users,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'products' | 'customers';
}

interface ParsedProductRow {
  name: string;
  category: string;
  unitPrice: number;
  initialStock: number;
  minAlert: number;
  isValid: boolean;
  errorReason?: string;
}

interface ParsedCustomerRow {
  name: string;
  phone: string;
  currentDebt: number;
  notes: string;
  isValid: boolean;
  errorReason?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'products',
}) => {
  const { products, customers, addCustomer } = useStore();

  const [activeImportType, setActiveImportType] = useState<'products' | 'customers'>(defaultTab);
  const [parsedProductRows, setParsedProductRows] = useState<ParsedProductRow[]>([]);
  const [parsedCustomerRows, setParsedCustomerRows] = useState<ParsedCustomerRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // 1. Download official standardized template based on active tab
  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BMS v0.1';

    if (activeImportType === 'products') {
      const sheet = workbook.addWorksheet('Products_Template');
      sheet.columns = [
        { header: 'Product Name', key: 'name', width: 28 },
        { header: 'Category', key: 'category', width: 16 },
        { header: 'Unit Price (NGN)', key: 'price', width: 18 },
        { header: 'Opening Stock (Loaves)', key: 'stock', width: 22 },
        { header: 'Min Alert Level', key: 'alert', width: 16 },
      ];

      sheet.addRow({ name: 'Jumbo Butter Bread', category: 'Bread', price: 1500, stock: 200, alert: 30 });
      sheet.addRow({ name: 'Sardine Special Loaf', category: 'Specialty', price: 1600, stock: 80, alert: 20 });
      sheet.addRow({ name: 'Coconut Sweet Rolls', category: 'Pastries', price: 900, stock: 120, alert: 25 });
      sheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BMS_Products_Template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      const sheet = workbook.addWorksheet('Customers_Template');
      sheet.columns = [
        { header: 'Customer / Business Name', key: 'name', width: 30 },
        { header: 'Phone Number', key: 'phone', width: 20 },
        { header: 'Opening Debt (NGN)', key: 'debt', width: 20 },
        { header: 'Credit Terms / Notes', key: 'notes', width: 35 },
      ];

      sheet.addRow({ name: 'Crown Stores', phone: '+234 803 555 1290', debt: 42000, notes: 'Bi-weekly credit terms' });
      sheet.addRow({ name: 'Big House Wholesale', phone: '+234 812 444 8765', debt: 85000, notes: 'Wholesale settlement on delivery' });
      sheet.addRow({ name: 'Alhaji Haruna Depot', phone: '+234 805 112 2334', debt: 45000, notes: 'Takes morning loaves on credit' });
      sheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BMS_Customers_Debtors_Template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // 2. Parse & Validate uploaded Excel file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setSuccessMessage('');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.worksheets[0];

      if (activeImportType === 'products') {
        const rows: ParsedProductRow[] = [];
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip headers
          const name = String(row.getCell(1).value || '').trim();
          const category = String(row.getCell(2).value || 'General').trim();
          const price = parseFloat(String(row.getCell(3).value || '0'));
          const stock = parseInt(String(row.getCell(4).value || '0'), 10);
          const alert = parseInt(String(row.getCell(5).value || '20'), 10);

          let isValid = true;
          let errorReason = '';

          if (!name) {
            isValid = false;
            errorReason = 'Missing product name';
          } else if (isNaN(price) || price <= 0) {
            isValid = false;
            errorReason = 'Price must be greater than 0';
          } else if (isNaN(stock) || stock < 0) {
            isValid = false;
            errorReason = 'Stock cannot be negative';
          }

          rows.push({
            name,
            category,
            unitPrice: price || 0,
            initialStock: stock || 0,
            minAlert: alert || 20,
            isValid,
            errorReason,
          });
        });
        setParsedProductRows(rows);
      } else {
        const rows: ParsedCustomerRow[] = [];
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip headers
          const name = String(row.getCell(1).value || '').trim();
          const phone = String(row.getCell(2).value || '').trim();
          const debt = parseFloat(String(row.getCell(3).value || '0'));
          const notes = String(row.getCell(4).value || '').trim();

          let isValid = true;
          let errorReason = '';

          if (!name) {
            isValid = false;
            errorReason = 'Missing customer name';
          } else if (isNaN(debt) || debt < 0) {
            isValid = false;
            errorReason = 'Debt cannot be negative';
          }

          rows.push({
            name,
            phone: phone || 'No phone recorded',
            currentDebt: debt || 0,
            notes,
            isValid,
            errorReason,
          });
        });
        setParsedCustomerRows(rows);
      }
    } catch (err) {
      console.error('Failed to parse Excel workbook:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Commit verified rows
  const handleCommitImport = () => {
    if (activeImportType === 'products') {
      const validRows = parsedProductRows.filter((r) => r.isValid);
      if (validRows.length === 0) return;

      validRows.forEach((r) => {
        products.push({
          id: `prod-imp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: r.name,
          category: r.category,
          unitPrice: r.unitPrice,
          currentStock: r.initialStock,
          minStockAlert: r.minAlert,
          isActive: true,
        });
      });

      setSuccessMessage(`Imported ${validRows.length} bread varieties into BMS catalog!`);
    } else {
      const validRows = parsedCustomerRows.filter((r) => r.isValid);
      if (validRows.length === 0) return;

      validRows.forEach((r) => {
        const newCust = addCustomer(r.name, r.phone, r.notes);
        if (r.currentDebt > 0) {
          newCust.currentDebt = r.currentDebt;
        }
      });

      setSuccessMessage(`Imported ${validRows.length} customer accounts & debtors into BMS!`);
    }

    setTimeout(() => {
      onClose();
      setParsedProductRows([]);
      setParsedCustomerRows([]);
      setFileName('');
      setSuccessMessage('');
    }, 1500);
  };

  const validProductsCount = parsedProductRows.filter((r) => r.isValid).length;
  const validCustomersCount = parsedCustomerRows.filter((r) => r.isValid).length;
  const currentValidCount = activeImportType === 'products' ? validProductsCount : validCustomersCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Bakery Records via Excel (.xlsx)"
      description="Controlled spreadsheet import for catalog items or customer credit ledgers."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Import Type Switcher */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => {
              setActiveImportType('products');
              setFileName('');
              setParsedProductRows([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeImportType === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Products & Opening Stock</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveImportType('customers');
              setFileName('');
              setParsedCustomerRows([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeImportType === 'customers'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Customers & Debtors Ledger</span>
          </button>
        </div>

        {/* Step 1: Download Standardized Template */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
          <div>
            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Step 1: Download {activeImportType === 'products' ? 'Products' : 'Customers'} Template</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Pre-structured `.xlsx` file with sample entries ready for your bakery data.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            <span>Download Template</span>
          </Button>
        </div>

        {/* Step 2: Upload File Input */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Step 2: Upload Completed Spreadsheet
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-5 text-center bg-surface hover:bg-muted/20 transition-colors">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-file-upload-dialog"
            />
            <label htmlFor="excel-file-upload-dialog" className="cursor-pointer space-y-1 block">
              <Upload className="mx-auto h-7 w-7 text-primary mb-1.5" />
              <div className="text-xs font-bold text-foreground">
                {fileName ? fileName : 'Click to choose Excel workbook (.xlsx)'}
              </div>
              <p className="text-[10px] text-muted-foreground">
                BMS validates all rows and provides a preview before applying changes.
              </p>
            </label>
          </div>
        </div>

        {/* Products Preview Table */}
        {activeImportType === 'products' && parsedProductRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Product Rows Preview:</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {validProductsCount} of {parsedProductRows.length} Valid
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto border border-border rounded-md text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/60 border-b border-border text-[10px] uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-2 px-3">Product Name</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Price</th>
                    <th className="py-2 px-3 text-right">Stock</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedProductRows.map((row, idx) => (
                    <tr key={idx} className={row.isValid ? '' : 'bg-red-50/50'}>
                      <td className="py-2 px-3 font-medium text-foreground">{row.name || '—'}</td>
                      <td className="py-2 px-3 text-muted-foreground">{row.category}</td>
                      <td className="py-2 px-3 text-right font-bold">{formatCurrency(row.unitPrice)}</td>
                      <td className="py-2 px-3 text-right">{row.initialStock} loaves</td>
                      <td className="py-2 px-3 text-center">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                            <AlertTriangle className="h-3 w-3" /> {row.errorReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers Preview Table */}
        {activeImportType === 'customers' && parsedCustomerRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Customer Rows Preview:</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {validCustomersCount} of {parsedCustomerRows.length} Valid
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto border border-border rounded-md text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/60 border-b border-border text-[10px] uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-2 px-3">Customer Name</th>
                    <th className="py-2 px-3">Phone</th>
                    <th className="py-2 px-3 text-right">Opening Debt</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedCustomerRows.map((row, idx) => (
                    <tr key={idx} className={row.isValid ? '' : 'bg-red-50/50'}>
                      <td className="py-2 px-3 font-medium text-foreground">{row.name || '—'}</td>
                      <td className="py-2 px-3 text-muted-foreground">{row.phone}</td>
                      <td className="py-2 px-3 text-right font-bold text-destructive">
                        {formatCurrency(row.currentDebt)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                            <AlertTriangle className="h-3 w-3" /> {row.errorReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={currentValidCount === 0 || isProcessing}
            onClick={handleCommitImport}
            className="gap-1.5"
          >
            <FileCheck className="h-4 w-4" />
            <span>Commit {currentValidCount} Records</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
