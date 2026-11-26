/** Built-in validation messages. Override per field with the `messages` prop. */
export interface NumberFieldMessages {
  invalid: string
  precision: (precision: number) => string
  min: (min: string) => string
  max: (max: string) => string
}

export const defaultNumberMessages: NumberFieldMessages = {
  invalid: 'Enter a valid number',
  precision: (p) => (p === 0 ? 'Enter a whole number' : `Use at most ${String(p)} decimal places`),
  min: (min) => `Must be at least ${min}`,
  max: (max) => `Must be at most ${max}`,
}
