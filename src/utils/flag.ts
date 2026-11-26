/** `true` or `undefined`, for boolean data-* and aria-* attributes that should be absent when off. */
export function flag(value: unknown): true | undefined {
  return value ? true : undefined
}
