import type { ReactNode } from 'react'

export interface TreeNode<T = unknown> {
  id: string
  label: string
  /** Child nodes. Omit and set `hasChildren` to load them lazily. */
  children?: TreeNode<T>[]
  /** Has children that `loadChildren` will fetch. */
  hasChildren?: boolean
  icon?: ReactNode
  /** Extra text after the label (code, count). */
  description?: string
  disabled?: boolean
  /** Your data. */
  data?: T
}

export interface FlatNode<T> {
  node: TreeNode<T>
  level: number
  parentId: string | null
  /** 1-based position among siblings. */
  posInSet: number
  setSize: number
  expandable: boolean
}

/** Visible nodes in display order, given the expanded set and loaded children. */
export function flattenTree<T>(
  nodes: readonly TreeNode<T>[],
  expanded: ReadonlySet<string>,
  loaded: ReadonlyMap<string, TreeNode<T>[]>,
  level = 1,
  parentId: string | null = null,
  out: FlatNode<T>[] = []
): FlatNode<T>[] {
  nodes.forEach((node, i) => {
    const children = node.children ?? loaded.get(node.id)
    const expandable = Boolean(children?.length) || (node.hasChildren === true && !children)
    out.push({ node, level, parentId, posInSet: i + 1, setSize: nodes.length, expandable })
    if (expandable && expanded.has(node.id) && children) flattenTree(children, expanded, loaded, level + 1, node.id, out)
  })
  return out
}

/** Ids of a node and all of its loaded descendants. */
export function descendantIds<T>(node: TreeNode<T>, loaded: ReadonlyMap<string, TreeNode<T>[]>): string[] {
  const children = node.children ?? loaded.get(node.id) ?? []
  return [node.id, ...children.flatMap((c) => descendantIds(c, loaded))]
}

/** Checked state of a node for tri-state checkboxes: leaves from `checked`, parents from their children. */
export function checkState<T>(
  node: TreeNode<T>,
  checked: ReadonlySet<string>,
  loaded: ReadonlyMap<string, TreeNode<T>[]>
): 'checked' | 'mixed' | 'unchecked' {
  const children = node.children ?? loaded.get(node.id)
  if (!children?.length) return checked.has(node.id) ? 'checked' : 'unchecked'
  const states = children.map((c) => checkState(c, checked, loaded))
  if (states.every((s) => s === 'checked')) return 'checked'
  if (states.every((s) => s === 'unchecked')) return checked.has(node.id) ? 'checked' : 'unchecked'
  return 'mixed'
}

/** Find a node by id anywhere in the tree (including loaded children). */
export function findNode<T>(
  nodes: readonly TreeNode<T>[],
  id: string,
  loaded: ReadonlyMap<string, TreeNode<T>[]>
): TreeNode<T> | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNode(node.children ?? loaded.get(node.id) ?? [], id, loaded)
    if (found) return found
  }
  return undefined
}

/** Ids of nodes whose label or description contains `text`, plus their ancestors (for auto-expanding search). */
export function matchingIds<T>(nodes: readonly TreeNode<T>[], text: string): { matches: Set<string>; ancestors: Set<string> } {
  const q = text.trim().toLowerCase()
  const matches = new Set<string>()
  const ancestors = new Set<string>()
  const walk = (list: readonly TreeNode<T>[], path: string[]) => {
    for (const node of list) {
      if (q && (node.label.toLowerCase().includes(q) || node.description?.toLowerCase().includes(q))) {
        matches.add(node.id)
        path.forEach((p) => ancestors.add(p))
      }
      if (node.children) walk(node.children, [...path, node.id])
    }
  }
  walk(nodes, [])
  return { matches, ancestors }
}
