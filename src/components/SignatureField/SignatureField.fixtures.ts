import type { SignatureValue } from './SignatureField'

/** Fixed clock so stories and tests show the same "Signed …" time. */
export const fixedNow = () => '2026-03-15T09:00:00Z'

const scribble =
  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="140" viewBox="0 0 480 140">' +
  '<path d="M30 95 C 60 20, 90 20, 95 80 S 130 120, 150 60 S 190 30, 200 90 L 215 70 C 240 40, 260 110, 290 70 S 340 40, 360 85 L 420 70" ' +
  'fill="none" stroke="#1f2933" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

export const drawnSignature: SignatureValue = {
  mode: 'draw',
  name: 'Dana Whitfield',
  dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(scribble)}`,
  signedAt: '2026-03-14T16:42:00Z',
}

export const typedSignature: SignatureValue = {
  mode: 'type',
  name: 'Dana Whitfield',
  dataUrl: '',
  signedAt: '2026-03-14T16:42:00Z',
}
