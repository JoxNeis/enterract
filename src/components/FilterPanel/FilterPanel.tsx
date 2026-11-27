import { useState, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import type { Key, Option, Size } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { FieldDefaultsProvider } from '../FormField'
import { Icon } from '../Icon'
import { Lookup, type LookupDataSource } from '../Lookup'
import { MultiSelect } from '../MultiSelect'
import { RangeFilter, type RangeValue } from '../RangeFilter'
import { Select } from '../Select'
import { TextField } from '../TextField'
import { isFilterActive } from './filterValues'
import '../../styles/base.css'
import './FilterPanel.css'

export type FilterType = 'text' | 'select' | 'multiselect' | 'checkbox' | 'number-range' | 'date-range' | 'lookup'

export interface FilterDefinition {
  id: string
  label: string
  type: FilterType
  options?: readonly Option<Key>[]
  lookup?: LookupDataSource<unknown, Key>
  placeholder?: string
}

export type FilterValues = Record<string, unknown>

export interface FilterPanelProps extends Omit<ComponentProps<'form'>, 'onChange' | 'onReset' | 'title' | 'defaultValue'> {
  filters: readonly FilterDefinition[]
  value?: FilterValues
  defaultValue?: FilterValues
  onChange?: (values: FilterValues) => void
  /** Apply button and Enter. With `applyMode="live"` it runs on every change. */
  onApply?: (values: FilterValues) => void
  onReset?: () => void
  applyMode?: 'button' | 'live'
  /** `bar` above a grid, `sidebar` in a side column. */
  layout?: 'bar' | 'sidebar'
  /** Header button hides the fields. */
  collapsible?: boolean
  defaultCollapsed?: boolean
  title?: ReactNode
  size?: Size
}

/** Hosts list filters with Apply and Reset, and shows how many are active. */
export function FilterPanel({
  filters,
  value,
  defaultValue = {},
  onChange,
  onApply,
  onReset,
  applyMode = 'button',
  layout = 'bar',
  collapsible = false,
  defaultCollapsed = false,
  title = 'Filters',
  size = 'sm',
  className,
  ...props
}: FilterPanelProps) {
  const [values, setValues] = useControllableState({ value, defaultValue, onChange })
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const active = filters.filter((f) => isFilterActive(values[f.id])).length

  const set = (id: string, v: unknown) => {
    const next = { ...values, [id]: v }
    setValues(next)
    if (applyMode === 'live') onApply?.(next)
  }

  const reset = () => {
    setValues({})
    onReset?.()
    if (applyMode === 'live') onApply?.({})
  }

  const renderFilter = (f: FilterDefinition) => {
    const v = values[f.id]
    switch (f.type) {
      case 'select':
        return (
          <Select<Key>
            key={f.id}
            label={f.label}
            options={f.options ?? []}
            placeholder={f.placeholder ?? 'Any'}
            clearable
            value={(v as Key | null | undefined) ?? null}
            onChange={(next) => {
              set(f.id, next)
            }}
          />
        )
      case 'multiselect':
        return (
          <MultiSelect<Key>
            key={f.id}
            label={f.label}
            options={f.options ?? []}
            placeholder={f.placeholder ?? 'Any'}
            searchable={(f.options?.length ?? 0) > 8}
            value={(v as Key[] | undefined) ?? []}
            onChange={(next) => {
              set(f.id, next)
            }}
          />
        )
      case 'checkbox':
        return (
          <Checkbox
            key={f.id}
            label={f.label}
            value={Boolean(v)}
            onChange={(next) => {
              set(f.id, next)
            }}
          />
        )
      case 'number-range':
        return (
          <RangeFilter
            key={f.id}
            type='number'
            label={f.label}
            value={(v as RangeValue<number> | undefined) ?? null}
            onChange={(next) => {
              set(f.id, next)
            }}
          />
        )
      case 'date-range':
        return (
          <RangeFilter
            key={f.id}
            type='date'
            label={f.label}
            value={(v as RangeValue<string> | undefined) ?? null}
            onChange={(next) => {
              set(f.id, next)
            }}
          />
        )
      case 'lookup':
        return f.lookup ? (
          <Lookup<unknown, Key>
            key={f.id}
            label={f.label}
            dataSource={f.lookup}
            placeholder={f.placeholder ?? 'Any'}
            value={(v as Key | null | undefined) ?? null}
            onChange={(next) => {
              set(f.id, next)
            }}
          />
        ) : null
      default:
        return (
          <TextField
            key={f.id}
            label={f.label}
            placeholder={f.placeholder}
            value={(v as string | null | undefined) ?? null}
            onChange={(next) => {
              set(f.id, next)
            }}
          />
        )
    }
  }

  return (
    <form
      role='search'
      aria-label={typeof title === 'string' ? title : 'Filters'}
      className={cx('erp-filter-panel', className)}
      data-layout={layout}
      onSubmit={(event) => {
        event.preventDefault()
        onApply?.(values)
      }}
      {...props}
    >
      <div className='erp-filter-panel__header'>
        {collapsible ? (
          <button
            type='button'
            className='erp-filter-panel__toggle'
            aria-expanded={!collapsed}
            onClick={() => {
              setCollapsed(!collapsed)
            }}
          >
            <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} />
            <Icon name='filter' />
            {title}
          </button>
        ) : (
          <span className='erp-filter-panel__title'>
            <Icon name='filter' />
            {title}
          </span>
        )}
        {active > 0 && (
          <span
            className='erp-filter-panel__count'
            aria-label={`${String(active)} active`}
          >
            {active}
          </span>
        )}
      </div>
      {!collapsed && (
        <>
          <div className='erp-filter-panel__fields'>
            <FieldDefaultsProvider size={size}>{filters.map(renderFilter)}</FieldDefaultsProvider>
          </div>
          <div className='erp-filter-panel__actions'>
            {applyMode === 'button' && (
              <Button
                type='submit'
                size={size}
                variant='primary'
              >
                Apply
              </Button>
            )}
            <Button
              size={size}
              variant='ghost'
              onClick={reset}
              disabled={active === 0}
            >
              Reset
            </Button>
          </div>
        </>
      )}
    </form>
  )
}
