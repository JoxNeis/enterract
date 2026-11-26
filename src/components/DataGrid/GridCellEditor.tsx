import { useEffect, useRef, type FocusEvent, type KeyboardEvent } from 'react'
import { useStableCallback } from '../../utils/hooks'
import type { Key } from '../../utils/types'
import { CurrencyField } from '../CurrencyField'
import { DatePicker } from '../DatePicker'
import { FieldDefaultsProvider } from '../FormField'
import { Lookup } from '../Lookup'
import { MultiSelect } from '../MultiSelect'
import { NumberField } from '../NumberField'
import { Select } from '../Select'
import { TextField } from '../TextField'
import { columnOptions } from './format'
import type { GridColumn, GridRow } from './types'

export type EditorExit = 'down' | 'right' | 'left' | 'none'

export interface GridCellEditorProps<TData, TMeta> {
  column: GridColumn<TData, TMeta>
  row: GridRow<TData, TMeta>
  label: string
  value: unknown
  onDraft: (value: unknown) => void
  commit: (value: unknown, exit: EditorExit) => void
  cancel: () => void
  locale: string
  /** Editing started by typing a character: put the caret at the end. */
  seeded: boolean
  /** Open the dropdown right away (Space on a select cell). */
  open: boolean
}

/**
 * Hosts a form control as a cell editor (Form Control Contract rule 7). Enter commits and moves
 * down, Tab/Shift+Tab commit and move right/left, Escape cancels, and blur commits. Keys the
 * control consumes (it calls preventDefault) are left alone.
 */
export function GridCellEditor<TData, TMeta>({
  column,
  row,
  label,
  value,
  onDraft,
  commit,
  cancel,
  locale,
  seeded,
  open,
}: GridCellEditorProps<TData, TMeta>) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const done = useRef(false)

  useEffect(() => {
    const input = wrapperRef.current?.querySelector('input')
    if (input?.type === 'text' && (seeded || document.activeElement === input)) {
      const end = input.value.length
      input.setSelectionRange(end, end)
    }
  }, [seeded])

  const finish = useStableCallback((exit: EditorExit, next: unknown = value) => {
    if (done.current) return
    done.current = true
    commit(next, exit)
  })
  const cancelOnce = useStableCallback(() => {
    done.current = true
    cancel()
  })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return
    const invalid = wrapperRef.current?.querySelector('[aria-invalid="true"]') !== null
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelOnce()
    } else if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
      event.preventDefault()
      if (!invalid) finish('down')
    } else if (event.key === 'Tab') {
      event.preventDefault()
      if (!invalid) finish(event.shiftKey ? 'left' : 'right')
    }
  }

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as HTMLElement | null
    if (next && (wrapperRef.current?.contains(next) || next.closest('.erp-popover'))) return
    // Let a pending click inside a portal (calendar, list) run first.
    setTimeout(() => {
      const active = document.activeElement
      if (active && (wrapperRef.current?.contains(active) || active.closest('.erp-popover'))) return
      finish('none')
    }, 0)
  }

  const common = { label, hideLabel: true, autoFocus: true }
  let editor
  if (column.renderEditor) {
    editor = column.renderEditor({
      value,
      onChange: onDraft,
      row,
      column,
      commit: (v) => {
        finish('none', v === undefined ? value : v)
      },
      cancel: cancelOnce,
    })
  } else {
    switch (column.editor) {
      case 'number':
        editor = (
          <NumberField
            {...common}
            value={(value as number | null | undefined) ?? null}
            onChange={onDraft}
            precision={column.precision}
            min={column.min}
            max={column.max}
            locale={locale}
          />
        )
        break
      case 'currency':
        editor = (
          <CurrencyField
            {...common}
            value={(value as string | null | undefined) ?? null}
            onChange={onDraft}
            currency={column.currency}
            locale={locale}
          />
        )
        break
      case 'date':
        editor = (
          <DatePicker
            {...common}
            value={(value as string | null | undefined) ?? null}
            onChange={onDraft}
            locale={locale}
          />
        )
        break
      case 'select':
        editor = (
          <Select<Key>
            {...common}
            options={columnOptions(column, row)}
            value={(value as Key | null | undefined) ?? null}
            defaultOpen={open}
            onChange={(v) => {
              onDraft(v)
              finish('none', v)
            }}
          />
        )
        break
      case 'multiselect':
        editor = (
          <MultiSelect<Key>
            {...common}
            options={columnOptions(column, row)}
            value={(value as Key[] | null | undefined) ?? []}
            onChange={onDraft}
          />
        )
        break
      case 'lookup':
        editor = column.lookup ? (
          <Lookup<unknown, Key>
            {...common}
            dataSource={column.lookup}
            columns={column.lookupColumns}
            value={(value as Key | null | undefined) ?? null}
            onChange={(key) => {
              onDraft(key)
              finish('none', key)
            }}
          />
        ) : null
        break
      default:
        editor = (
          <TextField
            {...common}
            value={(value as string | null | undefined) ?? null}
            onChange={onDraft}
          />
        )
    }
  }

  return (
    <div
      ref={wrapperRef}
      className='erp-data-grid__editor'
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <FieldDefaultsProvider size='sm'>{editor}</FieldDefaultsProvider>
    </div>
  )
}
