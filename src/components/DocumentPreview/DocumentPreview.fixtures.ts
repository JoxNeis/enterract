import type { PreviewFile } from './DocumentPreview'

/** A deterministic "scanned document" image as an SVG data URL (no network needed). */
export function scanImage(title: string, lines: readonly string[], accent = '#257de0'): string {
  const rows = lines
    .map((line, i) => `<text x="40" y="${String(150 + i * 34)}" font-size="20" fill="#3d4a57">${line}</text>`)
    .join('')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">` +
    `<rect width="600" height="800" fill="#ffffff"/>` +
    `<rect x="0" y="0" width="600" height="90" fill="${accent}"/>` +
    `<text x="40" y="58" font-size="30" font-family="sans-serif" fill="#ffffff">${title}</text>` +
    `<g font-family="sans-serif">${rows}</g>` +
    `<line x1="40" y1="700" x2="300" y2="700" stroke="#3d4a57" stroke-width="2"/>` +
    `<text x="40" y="730" font-size="16" font-family="sans-serif" fill="#6b7785">Authorised signature</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Builds a valid one-page PDF with the given text lines (byte offsets computed, so viewers accept it). */
export function simplePdf(lines: readonly string[]): string {
  const text = lines
    .map((line, i) => `BT /F1 14 Tf 60 ${String(760 - i * 24)} Td (${line.replace(/[()\\]/g, (c) => `\\${c}`)}) Tj ET`)
    .join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${String(text.length)} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let body = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((obj, i) => {
    offsets.push(body.length)
    body += `${String(i + 1)} 0 obj\n${obj}\nendobj\n`
  })
  const xref = body.length
  body += `xref\n0 ${String(objects.length + 1)}\n0000000000 65535 f \n`
  body += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  body += `trailer\n<< /Size ${String(objects.length + 1)} /Root 1 0 R >>\nstartxref\n${String(xref)}\n%%EOF`
  return URL.createObjectURL(new Blob([body], { type: 'application/pdf' }))
}

export const invoiceScan: PreviewFile = {
  name: 'INV-2026-0318.png',
  type: 'image/svg+xml',
  url: scanImage('Invoice INV-2026-0318', ['Vendor: Northwind Supplies', 'Date: 15 Mar 2026', 'PO: PO-7781', 'Total: $4,218.50']),
}

export const deliveryNote: PreviewFile = {
  name: 'DN-55120.png',
  type: 'image/svg+xml',
  url: scanImage('Delivery note DN-55120', ['Received: 14 Mar 2026', 'Warehouse: WH-02', '12 x Pallet racking', 'Condition: good'], '#00b894'),
}

export const spreadsheet: PreviewFile = {
  name: 'price-list-2026.xlsx',
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  url: 'data:application/octet-stream,',
}

export function purchaseOrderPdf(): PreviewFile {
  return {
    name: 'PO-7781.pdf',
    type: 'application/pdf',
    url: simplePdf(['Purchase order PO-7781', 'Vendor: Northwind Supplies', '12 x Pallet racking @ $351.54', 'Total: $4,218.50']),
  }
}
