/**
 * BMS Robust DOM Print Utility
 * Clones the printable receipt or invoice directly into a dedicated top-level
 * print container on document.body.
 * 
 * Guarantees:
 * 1. Zero blank pages (no 0x0 iframe rendering traps).
 * 2. Zero truncation (completely bypasses React modal max-h-[90vh] & overflow-y-auto clipping).
 * 3. Zero background app bleed (#root is display: none during print).
 */
export function printReceiptOrInvoice(
  elementId: string,
  documentTitle: string = 'Receipt',
  isA4: boolean = false
) {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    window.print();
    return;
  }

  // Get or create top-level print container directly on document.body
  let printContainer = document.getElementById('bms-print-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'bms-print-container';
    document.body.appendChild(printContainer);
  }

  // Set mode and clone complete inner HTML
  printContainer.className = isA4 ? 'print-mode-a4' : 'print-mode-thermal';
  printContainer.innerHTML = sourceElement.innerHTML;

  // Set document title for PDF print filename
  const originalTitle = document.title;
  document.title = documentTitle;

  // Trigger browser print
  window.print();

  // Restore title after print dialog closes
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}
