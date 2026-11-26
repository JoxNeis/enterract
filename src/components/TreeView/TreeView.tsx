import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import type { Size } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { Icon } from '../Icon'
import { typeaheadIndex } from '../Listbox'
import { Spinner } from '../Spinner'
import { checkState, descendantIds, flattenTree, matchingIds, type FlatNode, type TreeNode } from './treeUtils'
import './TreeView.css'

export interface TreeViewProps<T = unknown> extends Omit<ComponentProps<'ul'>, 'onSelect' | 'children'> {
  nodes: readonly TreeNode<T>[]
  expanded?: readonly string[]
  defaultExpanded?: readonly string[]
  onExpandedChange?: (ids: string[]) => void
  selected?: readonly string[]
  defaultSelected?: readonly string[]
  onSelectedChange?: (ids: string[]) => void
  /** `multiple` with `checkable` shows tri-state checkboxes. */
  selectionMode?: 'none' | 'single' | 'multiple'
  /** Checkboxes; checking a parent checks its whole branch. */
  checkable?: boolean
  /** Fetch children for nodes with `hasChildren` and no `children`. */
  loadChildren?: (node: TreeNode<T>) => Promise<TreeNode<T>[]>
  /** Enter or double-click on a node. */
  onActivate?: (node: TreeNode<T>) => void
  renderLabel?: (node: TreeNode<T>) => ReactNode
  /** Highlight matches and expand their ancestors. */
  filterText?: string
  size?: Size
  /** Accessible name of the tree. */
  'aria-label'?: string
}

/**
 * Hierarchy (WAI-ARIA tree view): chart of accounts, org units, product categories. Up/Down move,
 * Right expands or enters, Left collapses or goes to the parent, Home/End, `*` expands siblings,
 * Enter activates, Space selects, typing jumps.
 */
export function TreeView<T = unknown>({
  nodes,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  selectionMode = 'single',
  checkable = false,
  loadChildren,
  onActivate,
  renderLabel,
  filterText = '',
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...props
}: TreeViewProps<T>) {
  const [expandedList, setExpanded] = useControllableState<readonly string[]>({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange ? (ids) => { onExpandedChange([...ids]) } : undefined,
  })
  const [selectedList, setSelected] = useControllableState<readonly string[]>({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange: onSelectedChange ? (ids) => { onSelectedChange([...ids]) } : undefined,
  })
  const [loaded, setLoaded] = useState<ReadonlyMap<string, TreeNode<T>[]>>(new Map())
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set())
  const [focusId, setFocusId] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const pendingFocus = useRef(false)
  const typed = useRef({ text: '', at: 0 })

  const { matches, ancestors } = matchingIds(nodes, filterText)
  const expanded = new Set([...expandedList, ...ancestors])
  const selected = new Set(selectedList)
  const flat = flattenTree(nodes, expanded, loaded)
  const current = flat.find((f) => f.node.id === focusId) ?? flat[0]

  useEffect(() => {
    if (!pendingFocus.current || !current) return
    pendingFocus.current = false
    const id = current.node.id
    Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? [])
      .find((el) => el.dataset.nodeId === id)
      ?.focus()
  })

  const focusNode = (item: FlatNode<T> | undefined) => {
    if (!item) return
    pendingFocus.current = true
    setFocusId(item.node.id)
  }

  const setOpen = (item: FlatNode<T>, open: boolean) => {
    const id = item.node.id
    if (open === expanded.has(id)) return
    setExpanded(open ? [...expandedList, id] : expandedList.filter((x) => x !== id))
    const hasChildren = item.node.children ?? loaded.get(id)
    if (open && !hasChildren && item.node.hasChildren && loadChildren && !loading.has(id)) {
      setLoading((s) => new Set(s).add(id))
      loadChildren(item.node)
        .then((children) => {
          setLoaded((m) => new Map(m).set(id, children))
        })
        .catch(() => {
          setLoaded((m) => new Map(m).set(id, []))
        })
        .finally(() => {
          setLoading((s) => {
            const next = new Set(s)
            next.delete(id)
            return next
          })
        })
    }
  }

  const toggleSelect = (node: TreeNode<T>) => {
    if (node.disabled || selectionMode === 'none') return
    if (selectionMode === 'single') {
      setSelected([node.id])
      return
    }
    if (checkable) {
      const ids = descendantIds(node, loaded)
      const on = checkState(node, selected, loaded) !== 'checked'
      const next = new Set(selected)
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)))
      setSelected([...next])
      return
    }
    setSelected(selected.has(node.id) ? selectedList.filter((x) => x !== node.id) : [...selectedList, node.id])
  }

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (!current) return
    const index = flat.indexOf(current)
    const { key } = event
    let handled = true
    if (key === 'ArrowDown') focusNode(flat[index + 1])
    else if (key === 'ArrowUp') focusNode(flat[index - 1])
    else if (key === 'Home') focusNode(flat[0])
    else if (key === 'End') focusNode(flat[flat.length - 1])
    else if (key === 'ArrowRight') {
      if (current.expandable && !expanded.has(current.node.id)) setOpen(current, true)
      else if (current.expandable) focusNode(flat[index + 1])
    } else if (key === 'ArrowLeft') {
      if (current.expandable && expanded.has(current.node.id)) setOpen(current, false)
      else focusNode(flat.find((f) => f.node.id === current.parentId))
    } else if (key === 'Enter') {
      if (selectionMode === 'single') toggleSelect(current.node)
      onActivate?.(current.node)
    } else if (key === ' ') toggleSelect(current.node)
    else if (key === '*') {
      const siblings = flat.filter((f) => f.parentId === current.parentId && f.expandable)
      setExpanded([...new Set([...expandedList, ...siblings.map((s) => s.node.id)])])
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typed.current.text = event.timeStamp - typed.current.at > 600 ? key : typed.current.text + key
      typed.current.at = event.timeStamp
      const items = flat.map((f) => ({ label: f.node.label, disabled: f.node.disabled }))
      const match = typeaheadIndex(items, typed.current.text, typed.current.text.length > 1 ? index - 1 : index)
      if (match >= 0) focusNode(flat[match])
    } else handled = false
    if (handled) event.preventDefault()
  }

  return (
    <ul
      ref={listRef}
      role='tree'
      aria-label={ariaLabel}
      aria-multiselectable={selectionMode === 'multiple' || undefined}
      className={cx('erp-tree-view', className)}
      data-size={size}
      onKeyDown={onKeyDown}
      {...props}
    >
      {flat.map((item) => {
        const { node, level, posInSet, setSize, expandable } = item
        const isExpanded = expandable && expanded.has(node.id)
        const isSelected = selected.has(node.id)
        const state = checkable ? checkState(node, selected, loaded) : null
        const isLoading = loading.has(node.id)
        return (
          <li
            key={node.id}
            role='treeitem'
            data-node-id={node.id}
            aria-level={level}
            aria-posinset={posInSet}
            aria-setsize={setSize}
            aria-expanded={expandable ? isExpanded : undefined}
            aria-selected={selectionMode === 'none' ? undefined : checkable ? undefined : isSelected}
            aria-checked={state === null ? undefined : state === 'mixed' ? 'mixed' : state === 'checked'}
            aria-disabled={flag(node.disabled)}
            aria-busy={flag(isLoading)}
            tabIndex={node.id === current?.node.id ? 0 : -1}
            className='erp-tree-view__item'
            data-match={flag(matches.has(node.id))}
            style={{ paddingInlineStart: `${String((level - 1) * 1.25 + 0.25)}rem` }}
            onClick={(event) => {
              event.stopPropagation()
              setFocusId(node.id)
              toggleSelect(node)
            }}
            onDoubleClick={() => {
              onActivate?.(node)
            }}
          >
            <span
              className='erp-tree-view__toggle'
              aria-hidden='true'
              onClick={(event) => {
                event.stopPropagation()
                setFocusId(node.id)
                if (expandable) setOpen(item, !isExpanded)
              }}
            >
              {isLoading ? (
                <Spinner
                  size='sm'
                  label={null}
                />
              ) : expandable ? (
                <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} />
              ) : null}
            </span>
            {state !== null && (
              <span
                className='erp-tree-view__check'
                data-state={state}
                aria-hidden='true'
              >
                {state === 'checked' ? <Icon name='check' /> : state === 'mixed' ? <Icon name='minus' /> : null}
              </span>
            )}
            {node.icon}
            <span className='erp-tree-view__label'>{renderLabel ? renderLabel(node) : node.label}</span>
            {node.description && <span className='erp-tree-view__description'>{node.description}</span>}
          </li>
        )
      })}
    </ul>
  )
}

