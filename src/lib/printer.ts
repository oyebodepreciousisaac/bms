/**
 * BMS Isolated Document Printing Utility
 * Renders printable receipt or invoice in an isolated iframe.
 * Eliminates modal overflow clipping, scroll truncation, and background app bleed.
 */
export function printReceiptOrInvoice(elementId: string, documentTitle: string = 'Receipt') {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    window.print();
    return;
  }

  // Reuse or create hidden printing iframe
  let iframe = document.getElementById('bms-isolated-print-frame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'bms-isolated-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);
  }

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) {
    window.print();
    return;
  }

  // Clone active document stylesheet and Tailwind definitions
  const existingStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((tag) => tag.outerHTML)
    .join('\n');

  const contentHtml = sourceElement.innerHTML;

  frameDoc.open();
  frameDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${documentTitle}</title>
        ${existingStyles}
        <style>
          @page {
            margin: 0mm !important;
            size: auto;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .isolated-print-container {
            width: 76mm; /* Standard 80mm roll, fits 58mm roll seamlessly with minimal margins */
            max-width: 100%;
            margin: 0 auto;
            padding: 3mm 2mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.25;
            background: #ffffff;
            color: #000000;
          }
          /* Ensure all text and borders render dark and sharp */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        <div class="isolated-print-container">
          ${contentHtml}
        </div>
      </body>
    </html>
  `);
  frameDoc.close();

  // Allow styles and fonts to paint before triggering print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print error, falling back to window.print():', err);
      window.print();
    }
  }, 250);
}

