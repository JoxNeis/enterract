import { useEffect, useState, type ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import type { FieldProps, Option } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FieldDefaultsProvider, FormField, useFieldProps } from '../FormField'
import { Select } from '../Select'
import '../../styles/base.css'
import './CascadingSelect.css'

export interface CascadeLevel {
  key: string
  label: string
  placeholder?: string
  /** Options for this level given the values of the levels above. May be async. */
  options: (parents: readonly string[]) => readonly Option[] | Promise<readonly Option[]>
}

export interface CascadingSelectProps extends Omit<FieldProps, 'name'>, Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | keyof FieldProps> {
  levels: readonly CascadeLevel[]
  /** One key per level (`null` = not chosen). */
  value?: readonly (string | null)[] | null
  defaultValue?: readonly (string | null)[] | null
  onChange?: (value: (string | null)[]) => void
  orientation?: 'horizontal' | 'vertical'
}

/**
 * Dependent dropdowns, e.g. Country → State → City. Each level's options depend on the levels
 * above; changing a level clears the ones below. Options may load asynchronously.
 */
export function CascadingSelect(props: CascadingSelectProps) {
  const [field, rest] = useFieldProps(props)
  const { levels, value, defaultValue, onChange, orientation = 'horizontal', ...native } = rest
  const [raw, setRaw] = useControllableState<readonly (string | null)[] | null>({
    value,
    defaultValue: defaultValue ?? levels.map(() => null),
    onChange: onChange ? (v) => { onChange([...(v ?? [])]) } : undefined,
  })
  const current = levels.map((_, i) => raw?.[i] ?? null)
  const [optionsByLevel, setOptions] = useState<Record<number, readonly Option[]>>({})
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const signature = JSON.stringify(current)

  // Load the options of each level whose parents are all chosen.
  useEffect(() => {
    let cancelled = false
    levels.forEach((level, i) => {
      const parents = current.slice(0, i)
      if (parents.some((p) => p === null)) return
      const result = level.options(parents as string[])
      const isAsync = result instanceof Promise
      if (isAsync) {
        queueMicrotask(() => {
          if (!cancelled) setLoading((l) => ({ ...l, [i]: true }))
        })
      }
      Promise.resolve(result)
        .then((opts) => {
          if (cancelled) return
          setOptions((o) => ({ ...o, [i]: opts }))
          if (isAsync) setLoading((l) => ({ ...l, [i]: false }))
        })
        .catch(() => {
          if (!cancelled) setLoading((l) => ({ ...l, [i]: false }))
        })
    })
    return () => {
      cancelled = true
    }
    // `signature` captures `current`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, levels])

  const set = (index: number, key: string | null) => {
    const next = current.map((v, i) => (i < index ? v : i === index ? key : null))
    setRaw(next)
  }

  return (
    <FormField
      {...field}
      group
      className={cx('erp-cascading-select', field.className)}
    >
      {(f) => (
        <div
          role='group'
          id={f.id}
          aria-labelledby={field.label != null ? f.labelId : undefined}
          aria-describedby={f.describedBy}
          className='erp-cascading-select__levels'
          data-orientation={orientation}
          {...native}
        >
          <FieldDefaultsProvider
            size={field.size}
            disabled={field.disabled}
            readOnly={field.readOnly}
          >
            {levels.map((level, i) => {
              const ready = current.slice(0, i).every((p) => p !== null)
              return (
                <Select
                  key={level.key}
                  label={level.label}
                  placeholder={ready ? (level.placeholder ?? `Select ${level.label.toLowerCase()}`) : `Choose ${levels[i - 1]?.label.toLowerCase() ?? ''} first`}
                  options={ready ? (optionsByLevel[i] ?? []) : []}
                  loading={loading[i]}
                  disabled={!ready}
                  invalid={f.invalid && current[i] === null && ready}
                  value={current[i] ?? null}
                  onChange={(key) => {
                    set(i, key)
                  }}
                />
              )
            })}
          </FieldDefaultsProvider>
        </div>
      )}
    </FormField>
  )
}
