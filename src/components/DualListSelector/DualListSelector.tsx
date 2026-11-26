import { useId, useState, type ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import type { FieldProps, Key, Option } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { IconButton } from '../IconButton'
import { Listbox } from '../Listbox'
import { SearchField } from '../SearchField'
import './DualListSelector.css'

export interface DualListSelectorProps<K extends Key = string>
  extends Omit<FieldProps, 'name'>, Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | keyof FieldProps> {
  options: readonly Option<K>[]
  /** Selected keys, in order. */
  value?: readonly K[] | null
  defaultValue?: readonly K[] | null
  onChange?: (value: K[]) => void
  availableLabel?: string
  selectedLabel?: string
  /** Show up/down buttons to order the selected list. */
  orderable?: boolean
  /** Filter boxes above the lists. */
  searchable?: boolean
}

/** Key of the item at `index` as a one-element list, or empty. */
function keyAt<K extends Key>(items: readonly Option<K>[], index: number): K[] {
  const item = items[index]
  return item ? [item.key] : []
}

/**
 * Two lists, Available and Selected, with buttons to move items between them (e.g. columns of a
 * report, users of a role). Enter or double-click moves the active item; Ctrl+click and
 * Space mark several.
 */
export function DualListSelector<K extends Key = string>(props: DualListSelectorProps<K>) {
  const [field, rest] = useFieldProps(props)
  const {
    options,
    value,
    defaultValue = [],
    onChange,
    availableLabel = 'Available',
    selectedLabel = 'Selected',
    orderable = false,
    searchable = true,
    ...native
  } = rest
  const [raw, setRaw] = useControllableState<readonly K[] | null>({
    value,
    defaultValue,
    onChange: onChange ? (v) => { onChange([...(v ?? [])]) } : undefined,
  })
  const selected = raw ?? []
  const id = useId()
  const [filters, setFilters] = useState({ left: '', right: '' })
  const [marked, setMarked] = useState<{ left: K[]; right: K[] }>({ left: [], right: [] })
  const [active, setActive] = useState({ left: 0, right: 0 })
  const editable = !field.disabled && !field.readOnly

  const byKey = new Map(options.map((o) => [o.key, o]))
  const match = (o: Option<K>, q: string) => !q || o.label.toLowerCase().includes(q.toLowerCase())
  const left = options.filter((o) => !selected.includes(o.key) && match(o, filters.left))
  const right = selected
    .map((k) => byKey.get(k))
    .filter((o): o is Option<K> => o !== undefined && match(o, filters.right))

  const move = (side: 'left' | 'right', keys: readonly K[]) => {
    if (!editable || keys.length === 0) return
    setRaw(side === 'left' ? [...selected, ...keys.filter((k) => !selected.includes(k))] : selected.filter((k) => !keys.includes(k)))
    setMarked({ left: [], right: [] })
  }
  const shift = (dir: -1 | 1) => {
    const keys = marked.right.length ? marked.right : keyAt(right, active.right)
    if (!keys.length || !editable) return
    const next = [...selected]
    const order = dir === -1 ? [...keys] : [...keys].reverse()
    for (const k of order) {
      const i = next.indexOf(k)
      const j = i + dir
      if (i < 0 || j < 0 || j >= next.length) continue
      const a = next[i]
      const b = next[j]
      if (a === undefined || b === undefined) continue
      next[i] = b
      next[j] = a
    }
    setRaw(next)
  }

  const list = (side: 'left' | 'right', items: Option<K>[], label: string) => {
    const marks = marked[side]
    const current = items[active[side]]
    const targets = marks.length ? marks : current ? [current.key] : []
    return (
      <div className='erp-dual-list__pane'>
        <span
          id={`${id}-${side}`}
          className='erp-dual-list__title'
        >
          {label} <span className='erp-dual-list__count'>({side === 'left' ? left.length : selected.length})</span>
        </span>
        {searchable && (
          <SearchField
            aria-label={`Filter ${label.toLowerCase()}`}
            size='sm'
            debounce={0}
            value={filters[side] || null}
            onChange={(v) => {
              setFilters((s) => ({ ...s, [side]: v ?? '' }))
            }}
          />
        )}
        <Listbox<K>
          id={`${id}-${side}-list`}
          aria-labelledby={`${id}-${side}`}
          className='erp-dual-list__list'
          options={items}
          multiple
          focusable
          selected={marks}
          activeIndex={Math.min(active[side], items.length - 1)}
          onActiveIndexChange={(i) => {
            setActive((a) => ({ ...a, [side]: i }))
          }}
          emptyText={side === 'left' ? 'Nothing left to add' : 'Nothing selected'}
          onSelect={(o, i) => {
            setActive((a) => ({ ...a, [side]: i }))
            setMarked((m) => ({ ...m, [side]: m[side].includes(o.key) ? m[side].filter((k) => k !== o.key) : [...m[side], o.key] }))
          }}
          onDoubleClick={() => {
            move(side, targets)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              move(side, targets)
            }
          }}
        />
      </div>
    )
  }

  const leftTargets = marked.left.length ? marked.left : keyAt(left, active.left)
  const rightTargets = marked.right.length ? marked.right : keyAt(right, active.right)

  return (
    <FormField
      {...field}
      group
      className={cx('erp-dual-list', field.className)}
    >
      {(f) => (
        <div
          role='group'
          id={f.id}
          aria-labelledby={field.label != null ? f.labelId : undefined}
          aria-describedby={f.describedBy}
          className='erp-dual-list__body'
          data-size={field.size}
          {...native}
        >
          {list('left', left, availableLabel)}
          <div
            className='erp-dual-list__buttons'
            role='toolbar'
            aria-label='Move items'
            aria-orientation='vertical'
          >
            <IconButton
              icon='chevron-right'
              aria-label='Add'
              variant='secondary'
              size='sm'
              disabled={!editable || leftTargets.length === 0}
              onClick={() => {
                move('left', leftTargets)
              }}
            />
            <IconButton
              icon='chevrons-right'
              aria-label='Add all'
              variant='secondary'
              size='sm'
              disabled={!editable || left.length === 0}
              onClick={() => {
                move('left', left.filter((o) => !o.disabled).map((o) => o.key))
              }}
            />
            <IconButton
              icon='chevron-left'
              aria-label='Remove'
              variant='secondary'
              size='sm'
              disabled={!editable || rightTargets.length === 0}
              onClick={() => {
                move('right', rightTargets)
              }}
            />
            <IconButton
              icon='chevrons-left'
              aria-label='Remove all'
              variant='secondary'
              size='sm'
              disabled={!editable || selected.length === 0}
              onClick={() => {
                move('right', selected)
              }}
            />
            {orderable && (
              <>
                <IconButton
                  icon='arrow-up'
                  aria-label='Move up'
                  variant='secondary'
                  size='sm'
                  disabled={!editable || rightTargets.length === 0}
                  onClick={() => {
                    shift(-1)
                  }}
                />
                <IconButton
                  icon='arrow-down'
                  aria-label='Move down'
                  variant='secondary'
                  size='sm'
                  disabled={!editable || rightTargets.length === 0}
                  onClick={() => {
                    shift(1)
                  }}
                />
              </>
            )}
          </div>
          {list('right', right, selectedLabel)}
        </div>
      )}
    </FormField>
  )
}
