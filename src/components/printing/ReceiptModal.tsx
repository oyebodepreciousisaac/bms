import React, { useState } from 'react';
import { Sale } from '../../types/domain.types';
import { bakeryBranding } from '../../config/branding.config';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Printer, CheckCircle2, AlertCircle, Copy, Check, Smartphone } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  if (!sale) return null;

  const [copiedThermal, setCopiedThermal] = useState(false);

  // Generate plain monospace text for Bluetooth ESC/POS mobile apps (RawBT, Bluetooth Print, etc.)
  const generateReceiptText = () => {
    const line = '--------------------------------';
    const doubleLine = '================================';
    const pad = (left: string, right: string, width = 32) => {
      const space = Math.max(1, width - left.length - right.length);
      return left + ' '.repeat(space) + right;
    };

    const textLines = [
      doubleLine,
      `       ${bakeryBranding.businessName.toUpperCase()}       `,
      `   SALES TRANSACTION RECEIPT    `,
      doubleLine,
      `Receipt: ${sale.receiptNumber}`,
      `Date: ${formatDateTime(sale.createdAt)}`,
      `Customer: ${sale.customerName.toUpperCase()}`,
      `Cashier: ${sale.recordedBy}`,
      `Payment: ${sale.paymentMethod.toUpperCase()}`,
      line,
      'ITEMS ORDERED:',
      ...sale.items.map(
        (item) =>
          `${item.productName}\n` +
          pad(`  ${item.quantity} pcs x ${formatCurrency(item.unitPrice)}`, formatCurrency(item.subtotal))
      ),
      line,
      pad('TOTAL SALE:', formatCurrency(sale.totalAmount)),
      pad('AMOUNT PAID:', formatCurrency(sale.paidAmount)),
      doubleLine,
      pad('BALANCE DUE:', formatCurrency(sale.balanceAmount)),
      doubleLine,
      '',
      `   ${bakeryBranding.receipt.headerGreeting}   `,
      `   ${bakeryBranding.receipt.footerMessage}   `,
      `   ${bakeryBranding.receipt.notice}   `,
      doubleLine,
    ];

    return textLines.join('\n');
  };

  const handleCopyReceiptText = () => {
    const text = generateReceiptText();
    navigator.clipboard.writeText(text);
    setCopiedThermal(true);
    setTimeout(() => setCopiedThermal(false), 2500);
  };

  const handlePrint = () => {
    document.body.classList.remove('print-mode-a4');
    document.body.classList.add('print-mode-thermal');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode-thermal');
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Receipt"
      description={`Receipt ${sale.receiptNumber}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Bluetooth App Text Copy Bar */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60 border border-border text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <Smartphone className="h-4 w-4 text-primary" />
            <span>58mm / 80mm Bluetooth Printer</span>
          </div>
          <button
            type="button"
            onClick={handleCopyReceiptText}
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline px-2 py-0.5"
            title="Copy formatted text for RawBT or Bluetooth Print mobile apps"
          >
            {copiedThermal ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy for Bluetooth App</span>
              </>
            )}
          </button>
        </div>

        {/* Printable Receipt Paper Container (Styled for 58mm / 80mm Thermal Paper) */}
        <div
          id="printable-receipt"
          className="mx-auto max-w-[340px] rounded border border-dashed border-border bg-white p-5 font-mono text-xs text-black shadow-xs"
        >
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-400">
            <h2 className="text-sm font-bold uppercase tracking-wider">{bakeryBranding.businessName}</h2>
            <p className="text-[11px] text-gray-600">{bakeryBranding.tagline}</p>
            <p className="text-[10px] text-gray-600">{bakeryBranding.address}</p>
            <p className="text-[10px] text-gray-600">Tel: {bakeryBranding.phone}</p>
          </div>

          {/* Transaction Metadata */}
          <div className="py-2.5 text-[11px] space-y-1 border-b border-dashed border-gray-400">
            <div className="flex justify-between">
              <span className="text-gray-600">Receipt No:</span>
              <span className="font-bold">{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{formatDateTime(sale.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-semibold">{sale.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cashier:</span>
              <span>{sale.recordedBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment:</span>
              <span className="uppercase font-medium">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-gray-400">
            <div className="flex justify-between text-[10px] uppercase text-gray-500 font-bold mb-1.5">
              <span>Item / Qty</span>
              <span>Subtotal</span>
            </div>
            <div className="space-y-1.5">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <div>
                    <div className="font-medium text-gray-900">{item.productName}</div>
                    <div className="text-[10px] text-gray-500">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="font-semibold text-right">{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Debt Summary */}
          <div className="py-2.5 space-y-1.5 text-[11px] border-b border-dashed border-gray-400">
            <div className="flex justify-between text-xs font-bold">
              <span>TOTAL SALE:</span>
              <span>{formatCurrency(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>AMOUNT PAID:</span>
              <span className="font-semibold">{formatCurrency(sale.paidAmount)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-dotted border-gray-300">
              <span className={sale.balanceAmount > 0 ? 'font-bold text-red-600' : 'text-gray-600'}>
                OUTSTANDING DEBT:
              </span>
              <span className={`font-bold ${sale.balanceAmount > 0 ? 'text-red-600 text-xs' : 'text-green-700'}`}>
                {formatCurrency(sale.balanceAmount)}
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 text-center space-y-1 text-[10px] text-gray-600">
            <p className="font-medium">{bakeryBranding.receipt.headerGreeting}</p>
            <p>{bakeryBranding.receipt.footerMessage}</p>
            <p className="text-[9px] text-gray-500 italic mt-1">{bakeryBranding.receipt.notice}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {sale.balanceAmount === 0 ? (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-4 w-4" /> Fully settled
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <AlertCircle className="h-4 w-4" /> Has outstanding balance
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-4 w-4" />
              <span>Print Bluetooth Slip (58/80mm)</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
