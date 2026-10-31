import React, { useState } from 'react';
import { Sale } from '../../types/domain.types';
import { bakeryBranding } from '../../config/branding.config';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Printer,
  CheckCircle2,
  AlertCircle,
  Building2,
  Smartphone,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { printReceiptOrInvoice } from '../../lib/printer';

interface InvoiceModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, isOpen, onClose }) => {
  if (!sale) return null;

  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');
  const [copiedThermal, setCopiedThermal] = useState(false);

  const invoiceNumber = sale.receiptNumber.replace('BMS-', 'INV-');

  // Generate plain monospace text for Bluetooth ESC/POS mobile apps (RawBT, Bluetooth Print, etc.)
  const generateThermalText = () => {
    const line = '--------------------------------';
    const doubleLine = '================================';
    const pad = (left: string, right: string, width = 32) => {
      const space = Math.max(1, width - left.length - right.length);
      return left + ' '.repeat(space) + right;
    };

    const textLines = [
      doubleLine,
      `       ${bakeryBranding.businessName.toUpperCase()}       `,
      `   COMMERCIAL SALES INVOICE     `,
      doubleLine,
      `Invoice: ${invoiceNumber}`,
      `Date: ${formatDateTime(sale.createdAt)}`,
      `Customer: ${sale.customerName.toUpperCase()}`,
      `Cashier: ${sale.recordedBy}`,
      `Channel: ${sale.paymentMethod.toUpperCase()}`,
      line,
      'ITEMS SOLD:',
      ...sale.items.map(
        (item) =>
          `${item.productName}\n` +
          pad(`  ${item.quantity} pcs x ${formatCurrency(item.unitPrice)}`, formatCurrency(item.subtotal))
      ),
      line,
      pad('INVOICE TOTAL:', formatCurrency(sale.totalAmount)),
      pad('AMOUNT RECEIVED:', formatCurrency(sale.paidAmount)),
      doubleLine,
      pad('BALANCE DUE (DEBT):', formatCurrency(sale.balanceAmount)),
      doubleLine,
      '',
      'BANK SETTLEMENT DETAILS:',
      `Bank: ${bakeryBranding.bankDetails.bankName}`,
      `Account: ${bakeryBranding.bankDetails.accountNumber}`,
      `Name: ${bakeryBranding.bankDetails.accountName}`,
      line,
      'Debtor Sign: ___________________',
      '',
      `   ${bakeryBranding.receipt.headerGreeting}   `,
      `   ${bakeryBranding.receipt.notice}   `,
      doubleLine,
    ];

    return textLines.join('\n');
  };

  const handleCopyThermalText = () => {
    const text = generateThermalText();
    navigator.clipboard.writeText(text);
    setCopiedThermal(true);
    setTimeout(() => setCopiedThermal(false), 2500);
  };

  const handlePrint = () => {
    const targetId = printFormat === 'thermal' ? 'printable-invoice-thermal' : 'printable-invoice-a4';
    printReceiptOrInvoice(targetId, `Invoice_${invoiceNumber}`, printFormat === 'a4');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Commercial Sales Invoice"
      description={`Official bakery sales document — ${invoiceNumber}`}
      maxWidth={printFormat === 'thermal' ? 'md' : 'xl'}
    >
      <div className="space-y-4">
        {/* Format Selector Bar (Onscreen Only) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 rounded-lg bg-muted/60 border border-border no-print">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1">
              Printer Format:
            </span>
            <button
              type="button"
              onClick={() => setPrintFormat('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                printFormat === 'thermal'
                  ? 'bg-surface text-foreground font-bold shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 text-primary" />
              <span>Bluetooth Thermal (58/80mm)</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintFormat('a4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                printFormat === 'a4'
                  ? 'bg-surface text-foreground font-bold shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Office A4 Invoice</span>
            </button>
          </div>

          {printFormat === 'thermal' && (
            <button
              type="button"
              onClick={handleCopyThermalText}
              className="flex items-center justify-center gap-1 text-[11px] font-medium text-primary hover:underline px-2 py-1"
              title="Copy formatted text to paste into Bluetooth printer mobile apps"
            >
              {copiedThermal ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Text for Bluetooth App</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 1. Thermal Bluetooth Invoice Layout (58mm / 80mm Roll) */}
        {printFormat === 'thermal' && (
          <div
            id="printable-invoice-thermal"
            className="mx-auto max-w-[340px] rounded border border-dashed border-border bg-white p-4 font-mono text-xs text-black shadow-xs"
          >
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-400">
              <h2 className="text-sm font-bold uppercase tracking-wider">{bakeryBranding.businessName}</h2>
              <div className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-gray-100 text-gray-800 border border-gray-300">
                COMMERCIAL INVOICE
              </div>
              <p className="text-[10px] text-gray-600 mt-1">{bakeryBranding.address}</p>
              <p className="text-[10px] text-gray-600">Tel: {bakeryBranding.phone}</p>
            </div>

            {/* Metadata */}
            <div className="py-2.5 text-[11px] space-y-1 border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice No:</span>
                <span className="font-bold">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{formatDateTime(sale.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-bold text-gray-900">{sale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cashier:</span>
                <span>{sale.recordedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Settlement:</span>
                <span className="uppercase font-medium">{sale.paymentMethod}</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-gray-400">
              <div className="flex justify-between text-[10px] uppercase text-gray-500 font-bold mb-1.5">
                <span>Bread Item / Qty</span>
                <span>Subtotal</span>
              </div>
              <div className="space-y-1.5">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div>
                      <div className="font-bold text-gray-900">{item.productName}</div>
                      <div className="text-[10px] text-gray-500">
                        {item.quantity} pcs x {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                    <div className="font-bold text-right">{formatCurrency(item.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Outstanding Debt */}
            <div className="py-2.5 space-y-1.5 text-[11px] border-b border-dashed border-gray-400">
              <div className="flex justify-between text-xs font-bold">
                <span>INVOICE TOTAL:</span>
                <span>{formatCurrency(sale.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>AMOUNT RECEIVED:</span>
                <span className="font-semibold text-green-700">{formatCurrency(sale.paidAmount)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t-2 border-dashed border-gray-400 text-xs font-extrabold">
                <span className={sale.balanceAmount > 0 ? 'text-red-600' : 'text-green-700'}>
                  OUTSTANDING DEBT:
                </span>
                <span className={sale.balanceAmount > 0 ? 'text-red-600' : 'text-green-700'}>
                  {formatCurrency(sale.balanceAmount)}
                </span>
              </div>
            </div>

            {/* Bank Payment Details for Settlement */}
            <div className="py-2.5 text-[10px] space-y-0.5 bg-gray-50 p-2 rounded border border-gray-200 mt-2">
              <div className="font-bold text-gray-900 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-amber-700" />
                <span>Bank Settlement Account:</span>
              </div>
              <div className="text-gray-700 font-semibold">{bakeryBranding.bankDetails.bankName}</div>
              <div className="text-gray-900 font-mono font-bold">{bakeryBranding.bankDetails.accountNumber}</div>
              <div className="text-gray-600">{bakeryBranding.bankDetails.accountName}</div>
            </div>

            {/* Signature & Footer */}
            <div className="pt-4 text-center space-y-2 text-[10px] text-gray-600">
              <div className="pt-4 border-t border-gray-400 text-center">
                <span className="text-gray-500 italic">Debtor / Customer Signature</span>
              </div>
              <p className="font-medium">{bakeryBranding.receipt.headerGreeting}</p>
              <p className="text-[9px] text-gray-500 italic">{bakeryBranding.receipt.notice}</p>
            </div>
          </div>
        )}

        {/* 2. Formal A4 Office Invoice Layout */}
        {printFormat === 'a4' && (
          <div
            id="printable-invoice-a4"
            className="mx-auto w-full max-w-2xl bg-white p-6 sm:p-8 rounded-md border border-border text-black shadow-xs text-xs"
          >
            {/* Top Brand Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-amber-700 text-white font-bold flex items-center justify-center text-sm">
                    {bakeryBranding.businessName}
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">
                    {bakeryBranding.businessName}
                  </h1>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">{bakeryBranding.tagline}</p>
                <p className="text-[11px] text-gray-600 mt-0.5">{bakeryBranding.address}</p>
                <p className="text-[11px] text-gray-600">Tel: {bakeryBranding.phone}</p>
                <p className="text-[11px] text-gray-600">Email: {bakeryBranding.email}</p>
              </div>

              <div className="sm:text-right">
                <span className="inline-block px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded bg-gray-100 text-gray-800 border border-gray-300">
                  Commercial Invoice
                </span>
                <div className="mt-2 space-y-0.5">
                  <div className="font-bold text-gray-900 text-sm">{invoiceNumber}</div>
                  <div className="text-gray-500 text-[11px]">Date: {formatDate(sale.createdAt)}</div>
                  <div className="text-gray-500 text-[11px]">
                    Time: {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer / Billed To Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-gray-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Billed To (Customer / Debtor):
                </span>
                <h3 className="font-bold text-sm text-gray-900 mt-0.5">{sale.customerName}</h3>
                <p className="text-[11px] text-gray-600">
                  Account ID: {sale.customerId}
                </p>
                <p className="text-[11px] text-gray-600">
                  Sales Representative: {sale.recordedBy}
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Payment Status:
                </span>
                <div className="mt-1">
                  {sale.balanceAmount === 0 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      PAID IN FULL
                    </span>
                  ) : sale.paidAmount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <AlertCircle className="h-3.5 w-3.5" />
                      PARTIAL PAYMENT (DEBTOR)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                      <AlertCircle className="h-3.5 w-3.5" />
                      UNPAID / FULL CREDIT
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 capitalize">
                  Settlement Channel: {sale.paymentMethod}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-300 text-[10px] uppercase font-bold text-gray-500">
                    <th className="py-2">Description / Bread Variety</th>
                    <th className="py-2 text-center">Quantity</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-gray-900">{item.productName}</td>
                      <td className="py-2.5 text-center text-gray-700">{item.quantity} loaves</td>
                      <td className="py-2.5 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals & Bank Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              {/* Payment Details */}
              <div className="bg-gray-50 p-3.5 rounded border border-gray-200 text-[11px] space-y-1">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-amber-700" />
                  <span>Bank Payment Details</span>
                </div>
                <p className="text-gray-600">Bank: <span className="font-semibold text-gray-900">{bakeryBranding.bankDetails.bankName}</span></p>
                <p className="text-gray-600">Account Name: <span className="font-semibold text-gray-900">{bakeryBranding.bankDetails.accountName}</span></p>
                <p className="text-gray-600">Account No: <span className="font-semibold font-mono text-gray-900">{bakeryBranding.bankDetails.accountNumber}</span></p>
                <p className="text-[10px] text-gray-500 italic mt-1">Please quote invoice number as reference.</p>
              </div>

              {/* Balances */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 text-gray-600">
                  <span>Invoice Subtotal:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(sale.totalAmount)}</span>
                </div>
                <div className="flex justify-between py-1 text-gray-600">
                  <span>Amount Paid:</span>
                  <span className="font-semibold text-green-700">{formatCurrency(sale.paidAmount)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-gray-900 text-sm font-bold">
                  <span>BALANCE OUTSTANDING:</span>
                  <span className={sale.balanceAmount > 0 ? 'text-red-600 font-extrabold' : 'text-green-700'}>
                    {formatCurrency(sale.balanceAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms & Authorization Signature */}
            <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-end text-[10px] text-gray-500 gap-4">
              <div>
                <p className="font-semibold text-gray-700">{bakeryBranding.receipt.headerGreeting}</p>
                <p>{bakeryBranding.receipt.notice}</p>
              </div>
              <div className="text-center sm:text-right border-t border-gray-400 pt-1 w-44">
                <span className="font-medium text-gray-700">Authorized Signature & Stamp</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Buttons (Onscreen Only) */}
        <div className="flex items-center justify-between pt-2 no-print">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1.5 shadow-sm">
              <Printer className="h-4 w-4" />
              <span>
                {printFormat === 'thermal' ? 'Print Bluetooth Slip (58/80mm)' : 'Print A4 Invoice'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
