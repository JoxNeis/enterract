/** Returns the value or throws: for tests and fixtures where a missing value is a bug. */
export function must<T>(value: T | null | undefined, what = 'value'): T {
  if (value === null || value === undefined) throw new Error(`Expected ${what}`)
  return value
}
