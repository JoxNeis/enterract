import type { ImageValue } from './ImageUpload'

const productSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
  '<rect width="400" height="300" fill="#e8f1fc"/>' +
  '<rect x="80" y="60" width="240" height="190" rx="6" fill="none" stroke="#257de0" stroke-width="10"/>' +
  '<line x1="80" y1="125" x2="320" y2="125" stroke="#257de0" stroke-width="8"/>' +
  '<line x1="80" y1="190" x2="320" y2="190" stroke="#257de0" stroke-width="8"/>' +
  '<rect x="105" y="85" width="60" height="38" fill="#f47230"/><rect x="175" y="85" width="60" height="38" fill="#f2a600"/>' +
  '<rect x="120" y="150" width="70" height="38" fill="#00b894"/></svg>'

const logoSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">' +
  '<rect width="300" height="300" fill="#ffffff"/><circle cx="150" cy="150" r="110" fill="#257de0"/>' +
  '<text x="150" y="178" font-size="84" font-family="sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle">NW</text></svg>'

const dataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

export const productPhoto: ImageValue = { url: dataUrl(productSvg), name: 'pallet-rack-PR-1200.svg' }

export const companyLogo: ImageValue = { url: dataUrl(logoSvg), name: 'northwind-logo.svg' }

/** A file to "upload" in play functions. */
export const productFile = () => new File([productSvg], 'pallet-rack-PR-1200.svg', { type: 'image/svg+xml' })
