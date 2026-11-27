import type { ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import type { Key } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { Button } from '../Button'
import { DatePicker } from '../DatePicker'
import { FieldDefaultsProvider } from '../FormField'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { MultiSelect } from '../MultiSelect'
import { NumberField } from '../NumberField'
import { Select } from '../Select'
import { TextField } from '../TextField'
import {
  emptyCondition,
  emptyGroup,
  filterToText,
  operatorLabels,
  operatorsFor,
  valueless,
  type FilterCondition,
  type FilterField,
  type FilterGroup,
} from './filterModel'
import '../../styles/base.css'
import './FilterBuilder.css'

export interface FilterBuilderProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  fields: readonly FilterField[]
  value?: FilterGroup
  defaultValue?: FilterGroup
  onChange?: (value: FilterGroup) => void
  /** Nesting depth for groups (1 = no sub-groups). */
  maxDepth?: number
  /** Show the plain-text summary under the builder. */
  showSummary?: boolean
  readOnly?: boolean
}

/**
 * Advanced filter: conditions combined with AND/OR, with nested groups. Use `evaluateFilter` to
 * filter client-side or send the tree to your API.
 */
export function FilterBuilder({
  fields,
  value,
  defaultValue,
  onChange,
  maxDepth = 2,
  showSummary = true,
  readOnly = false,
  className,
  ...props
}: FilterBuilderProps) {
  const [root, setRoot] = useControllableState<FilterGroup>({
    value,
    defaultValue: defaultValue ?? { ...emptyGroup(), rules: [emptyCondition(fields[0])] },
    onChange: onChange ? (v) => { onChange(v) } : undefined,
  })

  const update = (group: FilterGroup, id: string, fn: (g: FilterGroup) => FilterGroup): FilterGroup =>
    group.id === id ? fn(group) : { ...group, rules: group.rules.map((r) => (r.kind === 'group' ? update(r, id, fn) : r)) }
  const updateCondition = (group: FilterGroup, id: string, fn: (c: FilterCondition) => FilterCondition): FilterGroup => ({
    ...group,
    rules: group.rules.map((r) => (r.kind === 'group' ? updateCondition(r, id, fn) : r.id === id ? fn(r) : r)),
  })
  const remove = (group: FilterGroup, id: string): FilterGroup => ({
    ...group,
    rules: group.rules.filter((r) => r.id !== id).map((r) => (r.kind === 'group' ? remove(r, id) : r)),
  })

  const valueEditor = (c: FilterCondition, field: FilterField | undefined, label: string) => {
    if (!field || valueless.has(c.operator)) return null
    const set = (v: unknown) => {
      setRoot(updateCondition(root, c.id, (x) => ({ ...x, value: v })))
    }
    const common = { label, hideLabel: true }
    if (c.operator === 'between') {
      const [from, to] = Array.isArray(c.value) ? (c.value as unknown[]) : [null, null]
      const one = (part: 0 | 1, v: unknown) => {
        set(part === 0 ? [v, to ?? null] : [from ?? null, v])
      }
      return field.type === 'date' ? (
        <span className='erp-filter-builder__between'>
          <DatePicker
            {...common}
            label={`${label} from`}
            value={(from as string | null | undefined) ?? null}
            onChange={(v) => {
              one(0, v)
            }}
          />
          <span aria-hidden='true'>–</span>
          <DatePicker
            {...common}
            label={`${label} to`}
            value={(to as string | null | undefined) ?? null}
            onChange={(v) => {
              one(1, v)
            }}
          />
        </span>
      ) : (
        <span className='erp-filter-builder__between'>
          <NumberField
            {...common}
            label={`${label} from`}
            value={(from as number | null | undefined) ?? null}
            onChange={(v) => {
              one(0, v)
            }}
          />
          <span aria-hidden='true'>–</span>
          <NumberField
            {...common}
            label={`${label} to`}
            value={(to as number | null | undefined) ?? null}
            onChange={(v) => {
              one(1, v)
            }}
          />
        </span>
      )
    }
    switch (field.type) {
      case 'number':
        return (
          <NumberField
            {...common}
            value={(c.value as number | null | undefined) ?? null}
            onChange={set}
          />
        )
      case 'date':
        return (
          <DatePicker
            {...common}
            value={(c.value as string | null | undefined) ?? null}
            onChange={set}
          />
        )
      case 'select':
        return c.operator === 'in' ? (
          <MultiSelect<Key>
            {...common}
            options={field.options ?? []}
            value={(c.value as Key[] | null | undefined) ?? []}
            onChange={set}
          />
        ) : (
          <Select<Key>
            {...common}
            options={field.options ?? []}
            value={(c.value as Key | null | undefined) ?? null}
            onChange={set}
          />
        )
      default:
        return (
          <TextField
            {...common}
            value={(c.value as string | null | undefined) ?? null}
            onChange={set}
          />
        )
    }
  }

  const renderGroup = (group: FilterGroup, depth: number, label: string) => (
    <fieldset
      key={group.id}
      className='erp-filter-builder__group'
      data-depth={depth}
    >
      <legend className='erp-visually-hidden'>{label}</legend>
      <div
        className='erp-filter-builder__combinator'
        role='radiogroup'
        aria-label={`${label}: match`}
      >
        {(['and', 'or'] as const).map((op) => (
          <button
            key={op}
            type='button'
            role='radio'
            aria-checked={group.combinator === op}
            disabled={readOnly}
            onClick={() => {
              setRoot(update(root, group.id, (g) => ({ ...g, combinator: op })))
            }}
          >
            {op === 'and' ? 'All (AND)' : 'Any (OR)'}
          </button>
        ))}
        {depth > 0 && !readOnly && (
          <IconButton
            size='sm'
            icon='trash'
            aria-label={`Remove ${label}`}
            className='erp-filter-builder__remove-group'
            onClick={() => {
              setRoot(remove(root, group.id))
            }}
          />
        )}
      </div>
      <ul className='erp-filter-builder__rules'>
        {group.rules.map((rule, i) => {
          if (rule.kind === 'group')
            return <li key={rule.id}>{renderGroup(rule, depth + 1, `${label}, group ${String(i + 1)}`)}</li>
          const field = fields.find((f) => f.key === rule.field)
          const rowLabel = `${label}, condition ${String(i + 1)}`
          return (
            <li
              key={rule.id}
              className='erp-filter-builder__condition'
            >
              <Select
                label={`${rowLabel} field`}
                hideLabel
                options={fields.map((f) => ({ key: f.key, label: f.label }))}
                value={rule.field || null}
                onChange={(key) => {
                  const next = fields.find((f) => f.key === key)
                  setRoot(updateCondition(root, rule.id, (c) => ({ ...emptyCondition(next), id: c.id })))
                }}
              />
              <Select
                label={`${rowLabel} operator`}
                hideLabel
                options={(field ? operatorsFor[field.type] : []).map((op) => ({ key: op, label: operatorLabels[op] }))}
                value={rule.operator}
                onChange={(op) => {
                  if (op) setRoot(updateCondition(root, rule.id, (c) => ({ ...c, operator: op, value: op === 'between' ? [null, null] : op === 'in' ? [] : c.operator === 'between' || c.operator === 'in' ? null : c.value })))
                }}
              />
              <span className='erp-filter-builder__value'>{valueEditor(rule, field, `${rowLabel} value`)}</span>
              {!readOnly && (
                <IconButton
                  size='sm'
                  icon='close'
                  aria-label={`Remove ${rowLabel}`}
                  onClick={() => {
                    setRoot(remove(root, rule.id))
                  }}
                />
              )}
            </li>
          )
        })}
      </ul>
      {!readOnly && (
        <div className='erp-filter-builder__add'>
          <Button
            size='sm'
            variant='ghost'
            icon={<Icon name='add' />}
            onClick={() => {
              setRoot(update(root, group.id, (g) => ({ ...g, rules: [...g.rules, emptyCondition(fields[0])] })))
            }}
          >
            Add condition
          </Button>
          {depth + 1 < maxDepth && (
            <Button
              size='sm'
              variant='ghost'
              icon={<Icon name='add' />}
              onClick={() => {
                setRoot(update(root, group.id, (g) => ({ ...g, rules: [...g.rules, { ...emptyGroup(g.combinator === 'and' ? 'or' : 'and'), rules: [emptyCondition(fields[0])] }] })))
              }}
            >
              Add group
            </Button>
          )}
        </div>
      )}
    </fieldset>
  )

  const summary = filterToText(root, fields)

  return (
    <div
      className={cx('erp-filter-builder', className)}
      {...props}
    >
      <FieldDefaultsProvider
        size='sm'
        readOnly={readOnly}
      >
        {renderGroup(root, 0, 'Filter')}
      </FieldDefaultsProvider>
      {showSummary && (
        <p
          className='erp-filter-builder__summary'
          aria-live='polite'
        >
          <Icon name='filter' /> {summary || 'No conditions: all records match'}
        </p>
      )}
    </div>
  )
}
