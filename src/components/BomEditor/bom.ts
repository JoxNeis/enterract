import { roundTo } from '../../utils/number'

/** One line of a bill of materials. */
export interface BomComponent {
  id: string
  /** Item code (SKU). */
  item: string
  description?: string
  /** Quantity per one unit of the parent. */
  qty: number
  uom?: string
  /** Expected loss in percent (5 = 5 %), added to the extended quantity. */
  scrapPercent?: number
  children?: BomComponent[]
}

let counter = 0
export const newBomId = () => `bom-${String(++counter)}`

/** Quantity needed of each line to build `buildQty` units: qty × parent extended × (1 + scrap). */
export function extendedQuantities(lines: readonly BomComponent[], buildQty = 1, out = new Map<string, number>()): Map<string, number> {
  for (const line of lines) {
    const ext = roundTo(buildQty * line.qty * (1 + (line.scrapPercent ?? 0) / 100), 6)
    out.set(line.id, ext)
    if (line.children) extendedQuantities(line.children, ext, out)
  }
  return out
}

/** Total quantity per item across the whole BOM (leaves only): the material requirement. */
export function flattenRequirements(lines: readonly BomComponent[], buildQty = 1): Map<string, number> {
  const ext = extendedQuantities(lines, buildQty)
  const totals = new Map<string, number>()
  const walk = (list: readonly BomComponent[]) => {
    for (const l of list) {
      if (l.children?.length) walk(l.children)
      else totals.set(l.item, roundTo((totals.get(l.item) ?? 0) + (ext.get(l.id) ?? 0), 6))
    }
  }
  walk(lines)
  return totals
}

export function updateLine(lines: readonly BomComponent[], id: string, patch: Partial<BomComponent>): BomComponent[] {
  return lines.map((l) => (l.id === id ? { ...l, ...patch } : l.children ? { ...l, children: updateLine(l.children, id, patch) } : l))
}

export function removeLine(lines: readonly BomComponent[], id: string): BomComponent[] {
  return lines.filter((l) => l.id !== id).map((l) => (l.children ? { ...l, children: removeLine(l.children, id) } : l))
}

export function addChild(lines: readonly BomComponent[], parentId: string | null, child: BomComponent): BomComponent[] {
  if (parentId === null) return [...lines, child]
  return lines.map((l) =>
    l.id === parentId ? { ...l, children: [...(l.children ?? []), child] } : l.children ? { ...l, children: addChild(l.children, parentId, child) } : l
  )
}

export function allIds(lines: readonly BomComponent[]): string[] {
  return lines.flatMap((l) => [l.id, ...allIds(l.children ?? [])])
}
