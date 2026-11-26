/**
 * Mask syntax: `9` digit, `A` letter, `*` letter or digit, `X` upper-cased letter or digit.
 * Any other character is a literal that is inserted automatically.
 */
const SLOTS: Record<string, RegExp> = { '9': /\d/, A: /[a-z]/i, '*': /[a-z\d]/i, X: /[a-z\d]/i }

export const masks = {
  phoneUS: '(999) 999-9999',
  phoneID: '+62 999-9999-9999',
  /** Indonesian tax ID (NPWP, 15 digits). */
  npwp: '99.999.999.9-999.999',
  /** US employer ID. */
  ein: '99-9999999',
  postalUS: '99999',
  postalDE: '99999',
  /** German IBAN. Other countries differ in length. */
  ibanDE: 'XX99 9999 9999 9999 9999 99',
  date: '99/99/9999',
} as const

const isAlnum = (c: string) => /[a-z\d]/i.test(c)

/**
 * The slot characters of `text`. When `text` lines up with the mask (it was masked and then
 * extended), characters are read by position, so literal digits like the `62` in `+62` are
 * never confused with typed digits. Otherwise (pasted or edited in the middle) every letter and
 * digit is kept, minus a leading literal prefix.
 */
export function unmask(text: string, mask: string): string {
  let positional = ''
  let aligned = true
  for (let i = 0; i < text.length; i++) {
    const m = mask.charAt(i)
    const c = text.charAt(i)
    const slot = SLOTS[m]
    if (m === '') aligned = false
    else if (slot) {
      if (slot.test(c)) positional += c
      else aligned = false
    } else if (c !== m) aligned = false
    if (!aligned) break
  }
  if (aligned) return positional

  const firstSlot = Array.from(mask).findIndex((c) => c in SLOTS)
  const prefix = firstSlot > 0 ? mask.slice(0, firstSlot) : ''
  const prefixChars = Array.from(prefix).filter(isAlnum).join('')
  const chars = Array.from(text).filter(isAlnum).join('')
  return prefix && text.trimStart().startsWith(prefix.trimEnd()) ? chars.slice(prefixChars.length) : chars
}

/** Applies a mask to raw characters. Stops at the first character that doesn't fit its slot. */
export function applyMask(raw: string, mask: string): { masked: string; raw: string; complete: boolean } {
  let masked = ''
  let used = ''
  let i = 0
  for (const m of mask) {
    const slot = SLOTS[m]
    if (!slot) {
      if (i < raw.length) masked += m
      continue
    }
    const c = raw[i]
    if (c === undefined) break
    if (!slot.test(c)) break
    const ch = m === 'X' ? c.toUpperCase() : c
    masked += ch
    used += ch
    i++
  }
  const slots = Array.from(mask).filter((c) => c in SLOTS).length
  return { masked, raw: used, complete: used.length === slots }
}

/** Placeholder showing the expected shape, e.g. `(___) ___-____`. */
export function maskPlaceholder(mask: string, char = '_'): string {
  return Array.from(mask).map((c) => (c in SLOTS ? char : c)).join('')
}
