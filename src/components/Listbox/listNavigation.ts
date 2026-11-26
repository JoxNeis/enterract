interface Navigable {
  disabled?: boolean | undefined
}

const PAGE = 10

/**
 * Next active index for a navigation key, skipping disabled items. Returns `null` when the key
 * is not a navigation key. Used by every listbox-based control.
 */
export function nextActiveIndex(items: readonly Navigable[], current: number, key: string): number | null {
  const count = items.length
  if (count === 0) return null
  const enabled = (i: number) => items[i] !== undefined && !items[i].disabled

  const scan = (start: number, step: number): number => {
    for (let i = start; i >= 0 && i < count; i += step) if (enabled(i)) return i
    return current
  }

  switch (key) {
    case 'ArrowDown':
      return current < 0 ? scan(0, 1) : scan(current + 1, 1)
    case 'ArrowUp':
      return current < 0 ? scan(count - 1, -1) : scan(current - 1, -1)
    case 'Home':
      return scan(0, 1)
    case 'End':
      return scan(count - 1, -1)
    case 'PageDown':
      return scan(Math.min(count - 1, Math.max(current, 0) + PAGE), -1)
    case 'PageUp':
      return scan(Math.max(0, current - PAGE), 1)
    default:
      return null
  }
}

/** Index of the first enabled item whose label starts with `text`, searching after `from`. */
export function typeaheadIndex(items: readonly (Navigable & { label: string })[], text: string, from: number): number {
  const query = text.toLowerCase()
  for (let step = 1; step <= items.length; step++) {
    const i = (from + step) % items.length
    const item = items[i]
    if (item && !item.disabled && item.label.toLowerCase().startsWith(query)) return i
  }
  return -1
}

/** DOM id of an option, for aria-activedescendant. */
export function getOptionId(listboxId: string, index: number): string {
  return `${listboxId}-option-${String(index)}`
}
