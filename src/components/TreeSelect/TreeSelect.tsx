import { useRef, useState } from 'react'
import { PickerTrigger } from '../../internal/PickerTrigger'
import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Popover } from '../Popover'
import { SearchField } from '../SearchField'
import { findNode, TreeView, type TreeNode } from '../TreeView'
import '../../styles/base.css'
import './TreeSelect.css'

interface BaseProps<T> extends FieldProps, NativeDivProps {
  nodes: readonly TreeNode<T>[]
  /** Fetch children for nodes with `hasChildren`. */
  loadChildren?: (node: TreeNode<T>) => Promise<TreeNode<T>[]>
  /** Search box above the tree. */
  searchable?: boolean
  /** Single mode: allow picking nodes that have children (e.g. a parent account). */
  selectableParents?: boolean
  placeholder?: string
  defaultExpanded?: readonly string[]
}

export interface SingleTreeSelectProps<T> extends BaseProps<T> {
  multiple?: false
  value?: string | null
  defaultValue?: string | null
  onChange?: (id: string | null) => void
}

export interface MultipleTreeSelectProps<T> extends BaseProps<T> {
  /** Checkboxes; checking a parent checks its branch. */
  multiple: true
  value?: readonly string[] | null
  defaultValue?: readonly string[] | null
  onChange?: (ids: string[]) => void
}

export type TreeSelectProps<T = unknown> = SingleTreeSelectProps<T> | MultipleTreeSelectProps<T>

/** Pick one or more nodes from a hierarchy (account, cost center, product category) in a dropdown. */
export function TreeSelect<T = unknown>(props: TreeSelectProps<T>) {
  const [field, rest] = useFieldProps(props)
  const {
    nodes,
    loadChildren,
    searchable = true,
    selectableParents = true,
    placeholder = 'Select…',
    defaultExpanded = [],
    multiple = false,
  } = rest
  const [raw, setRaw] = useControllableState<string | readonly string[] | null>({
    value: props.value,
    defaultValue: props.defaultValue ?? (multiple ? [] : null),
    onChange: props.onChange as ((v: string | readonly string[] | null) => void) | undefined,
  })
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const triggerRef = useRef<HTMLDivElement>(null)
  const ids = raw === null ? [] : typeof raw === 'string' ? [raw] : [...raw]
  const leafOrAll = multiple
    ? ids.filter((id) => {
        const node = findNode(nodes, id, new Map())
        return !node?.children?.length
      })
    : ids
  const labels = leafOrAll.map((id) => findNode(nodes, id, new Map())?.label ?? id)
  const text = labels.length === 0 ? null : labels.length > 2 ? `${labels.slice(0, 2).join(', ')} +${String(labels.length - 2)}` : labels.join(', ')

  const close = () => {
    setOpen(false)
    setFilter('')
    triggerRef.current?.focus()
  }

  return (
    <FormField
      {...field}
      className={cx('erp-tree-select', field.className)}
    >
      {(f) => (
        <div>
          <PickerTrigger
            ref={triggerRef}
            controlProps={f.controlProps}
            labelId={field.label != null ? f.labelId : undefined}
            open={open}
            onToggle={() => {
              setOpen((o) => !o)
            }}
            text={text}
            placeholder={placeholder}
            icon='chevron-down'
            size={field.size}
            invalid={f.invalid}
            disabled={field.disabled}
            readOnly={field.readOnly}
          />
          <Popover
            open={open}
            anchorRef={triggerRef}
            matchAnchorWidth
            role='dialog'
            aria-label={typeof field.label === 'string' ? field.label : 'Choose'}
            className='erp-tree-select__popover'
            onClose={(reason) => {
              if (reason === 'escape') close()
              else {
                setOpen(false)
                setFilter('')
              }
            }}
          >
            {searchable && (
              <div className='erp-tree-select__search'>
                <SearchField
                  aria-label='Search'
                  size='sm'
                  debounce={0}
                  value={filter || null}
                  onChange={(v) => {
                    setFilter(v ?? '')
                  }}
                />
              </div>
            )}
            <TreeView<T>
              nodes={nodes}
              aria-label={typeof field.label === 'string' ? field.label : 'Options'}
              loadChildren={loadChildren}
              filterText={filter}
              size='sm'
              defaultExpanded={defaultExpanded}
              selectionMode={multiple ? 'multiple' : 'single'}
              checkable={multiple}
              selected={ids}
              onSelectedChange={(next) => {
                if (multiple) {
                  setRaw(next)
                  return
                }
                const id = next[next.length - 1] ?? null
                const node = id ? findNode(nodes, id, new Map()) : undefined
                if (id && node?.children?.length && !selectableParents) return
                setRaw(id)
                close()
              }}
            />
          </Popover>
        </div>
      )}
    </FormField>
  )
}
