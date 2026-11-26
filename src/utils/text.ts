/** Display text for any value: '' for null/undefined, JSON for objects, String() otherwise. */
export function toText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value)
  if (value instanceof Date) return value.toISOString()
  return JSON.stringify(value)
}
