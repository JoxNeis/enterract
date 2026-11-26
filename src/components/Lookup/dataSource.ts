import type { Key } from '../../utils/types'

/** One search request from a Lookup. */
export interface LookupQuery {
  /** Typed text. Empty string = browse. */
  search: string
  /** 0-based page index. */
  page: number
  pageSize: number
  /** Extra filters from the Lookup's `filters` prop (company, active only…). */
  filters?: Record<string, unknown>
  /** Aborted when a newer search starts or the Lookup unmounts. */
  signal: AbortSignal
}

export interface LookupPage<T> {
  items: T[]
  /** Total matches, when the server knows it. */
  total?: number
  /** More pages exist. Derived from `total` when omitted. */
  hasMore?: boolean
}

/**
 * Adapter between a Lookup and your API: paged server-side search plus how to read an item's
 * key and label. Implement it once per entity (customers, items, accounts…).
 */
export interface LookupDataSource<T, K extends Key = string> {
  search: (query: LookupQuery) => Promise<LookupPage<T>>
  getKey: (item: T) => K
  getLabel: (item: T) => string
  /** Load one item, so a Lookup with only a key can show its label. */
  getByKey?: (key: K, signal: AbortSignal) => Promise<T | null>
  /** Label for a key without a request, when it's already known (used by grid display). */
  peekLabel?: (key: K) => string | undefined
  /** Resolve pasted text (a code or name) to a key synchronously, for grid paste. */
  resolveText?: (text: string) => K | null
}

export interface InMemorySourceOptions<T, K extends Key> {
  getKey: (item: T) => K
  getLabel: (item: T) => string
  /** Fields matched by the search text. Defaults to the label. */
  searchFields?: ((item: T) => string)[]
  /** Fake network delay in ms (stories, prototypes). */
  delay?: number
}

/** A LookupDataSource over an array, with paging and an optional fixed delay. */
export function createInMemorySource<T, K extends Key = string>(
  items: readonly T[],
  { getKey, getLabel, searchFields, delay = 0 }: InMemorySourceOptions<T, K>
): LookupDataSource<T, K> {
  const fields = searchFields ?? [getLabel]
  const byKey = new Map<K, T>(items.map((item) => [getKey(item), item]))
  const wait = <R>(value: R, signal?: AbortSignal) =>
    new Promise<R>((resolve, reject) => {
      if (delay <= 0) {
        resolve(value)
        return
      }
      const timer = setTimeout(() => {
        resolve(value)
      }, delay)
      signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })

  return {
    getKey,
    getLabel,
    search: ({ search, page, pageSize, signal }) => {
      const q = search.trim().toLowerCase()
      const matches = q ? items.filter((item) => fields.some((f) => f(item).toLowerCase().includes(q))) : [...items]
      const start = page * pageSize
      return wait(
        { items: matches.slice(start, start + pageSize), total: matches.length, hasMore: start + pageSize < matches.length },
        signal
      )
    },
    getByKey: (key, signal) => wait(byKey.get(key) ?? null, signal),
    peekLabel: (key) => {
      const item = byKey.get(key)
      return item ? getLabel(item) : undefined
    },
    resolveText: (text) => {
      const q = text.trim().toLowerCase()
      if (!q) return null
      for (const item of items) {
        if (String(getKey(item)).toLowerCase() === q || getLabel(item).toLowerCase() === q) return getKey(item)
      }
      for (const item of items) {
        if (fields.some((f) => f(item).toLowerCase() === q)) return getKey(item)
      }
      return null
    },
  }
}
