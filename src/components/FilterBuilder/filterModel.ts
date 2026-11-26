import type { Key, Option } from '../../utils/types'

export type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean'

export interface FilterField {
  key: string
  label: string
  type: FilterFieldType
  /** For `select` fields. */
  options?: readonly Option<Key>[]
}

export type Operator =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEquals'
  | 'startsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'before'
  | 'after'
  | 'in'
  | 'isTrue'
  | 'isFalse'
  | 'isEmpty'
  | 'isNotEmpty'

export interface FilterCondition {
  kind: 'condition'
  id: string
  field: string
  operator: Operator
  /** `between` uses `[from, to]`; `in` uses a list; empty/boolean operators ignore it. */
  value: unknown
}

export interface FilterGroup {
  kind: 'group'
  id: string
  combinator: 'and' | 'or'
  rules: (FilterCondition | FilterGroup)[]
}

export const operatorLabels: Record<Operator, string> = {
  contains: 'contains',
  notContains: 'does not contain',
  equals: 'is',
  notEquals: 'is not',
  startsWith: 'starts with',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  between: 'between',
  before: 'before',
  after: 'after',
  in: 'is any of',
  isTrue: 'is yes',
  isFalse: 'is no',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
}

export const operatorsFor: Record<FilterFieldType, Operator[]> = {
  text: ['contains', 'notContains', 'equals', 'notEquals', 'startsWith', 'isEmpty', 'isNotEmpty'],
  number: ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'between', 'isEmpty', 'isNotEmpty'],
  date: ['equals', 'before', 'after', 'between', 'isEmpty', 'isNotEmpty'],
  select: ['equals', 'notEquals', 'in', 'isEmpty', 'isNotEmpty'],
  boolean: ['isTrue', 'isFalse'],
}

/** Operators that take no value. */
export const valueless = new Set<Operator>(['isTrue', 'isFalse', 'isEmpty', 'isNotEmpty'])

let counter = 0
export const newId = (prefix: string) => `${prefix}-${String(++counter)}`

export function emptyCondition(field: FilterField | undefined): FilterCondition {
  return { kind: 'condition', id: newId('c'), field: field?.key ?? '', operator: field ? (operatorsFor[field.type][0] ?? 'equals') : 'equals', value: null }
}

export function emptyGroup(combinator: 'and' | 'or' = 'and'): FilterGroup {
  return { kind: 'group', id: newId('g'), combinator, rules: [] }
}

const isEmpty = (v: unknown) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

/** Does a record match a condition? Incomplete conditions (no value yet) match everything. */
export function matchCondition(c: FilterCondition, record: Record<string, unknown>): boolean {
  const v = record[c.field]
  const target = c.value
  if (!valueless.has(c.operator) && isEmpty(target)) return true
  const text = (x: unknown) => (typeof x === 'string' ? x.toLowerCase() : String(x).toLowerCase())
  switch (c.operator) {
    case 'contains':
      return text(v ?? '').includes(text(target))
    case 'notContains':
      return !text(v ?? '').includes(text(target))
    case 'startsWith':
      return text(v ?? '').startsWith(text(target))
    case 'equals':
      return typeof v === 'string' && typeof target === 'string' ? v.toLowerCase() === target.toLowerCase() : v === target
    case 'notEquals':
      return typeof v === 'string' && typeof target === 'string' ? v.toLowerCase() !== target.toLowerCase() : v !== target
    case 'gt':
    case 'after':
      return !isEmpty(v) && compare(v, target) > 0
    case 'gte':
      return !isEmpty(v) && compare(v, target) >= 0
    case 'lt':
    case 'before':
      return !isEmpty(v) && compare(v, target) < 0
    case 'lte':
      return !isEmpty(v) && compare(v, target) <= 0
    case 'between': {
      const [from, to] = Array.isArray(target) ? (target as unknown[]) : []
      return !isEmpty(v) && (isEmpty(from) || compare(v, from) >= 0) && (isEmpty(to) || compare(v, to) <= 0)
    }
    case 'in':
      return Array.isArray(target) && target.includes(v)
    case 'isTrue':
      return v === true
    case 'isFalse':
      return v !== true
    case 'isEmpty':
      return isEmpty(v)
    case 'isNotEmpty':
      return !isEmpty(v)
  }
}

/** Client-side evaluation of a filter tree. An empty group matches everything. */
export function evaluateFilter(group: FilterGroup, record: Record<string, unknown>): boolean {
  if (group.rules.length === 0) return true
  const results = group.rules.map((r) => (r.kind === 'group' ? evaluateFilter(r, record) : matchCondition(r, record)))
  return group.combinator === 'and' ? results.every(Boolean) : results.some(Boolean)
}

/** Human-readable summary: `Status is Open AND (Amount > 1000 OR Customer contains "acme")`. */
export function filterToText(group: FilterGroup, fields: readonly FilterField[], nested = false): string {
  const parts = group.rules
    .map((r) => {
      if (r.kind === 'group') return r.rules.length ? filterToText(r, fields, true) : ''
      const field = fields.find((f) => f.key === r.field)
      const label = field?.label ?? r.field
      if (valueless.has(r.operator)) return `${label} ${operatorLabels[r.operator]}`
      if (isEmpty(r.value)) return ''
      const show = (x: unknown) => {
        const opt = field?.options?.find((o) => o.key === x)
        return opt ? opt.label : field?.type === 'text' ? `"${String(x)}"` : String(x)
      }
      const value = Array.isArray(r.value)
        ? r.operator === 'between'
          ? r.value.map(show).join(' and ')
          : r.value.map(show).join(', ')
        : show(r.value)
      return `${label} ${operatorLabels[r.operator]} ${value}`
    })
    .filter(Boolean)
  const joined = parts.join(` ${group.combinator.toUpperCase()} `)
  return nested && parts.length > 1 ? `(${joined})` : joined
}
