import { useState, type ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { formatNumber } from '../../utils/number'
import { useControllableState } from '../../utils/useControllableState'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { useLocale } from '../LocaleProvider'
import { NumberField } from '../NumberField'
import { TreeGrid, type TreeGridColumn, type TreeGridRow } from '../TreeGrid'
import { addChild, allIds, extendedQuantities, newBomId, removeLine, updateLine, type BomComponent } from './bom'
import '../../styles/base.css'
import './BomEditor.css'

interface BomRowData {
  item: string
  description: string
  qty: number
  uom: string
  scrapPercent: number | null
  extended: number
}

export interface BomEditorProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  /** Top-level components of the product. */
  value?: readonly BomComponent[]
  defaultValue?: readonly BomComponent[]
  onChange?: (lines: BomComponent[]) => void
  /** Product being built, shown in the header. */
  productName?: string
  /** Units to build, for the extended quantities. */
  defaultBuildQty?: number
  readOnly?: boolean
}

/**
 * Bill of materials editor on TreeGrid: components with quantity per parent, unit and scrap, and
 * the extended quantity needed for the build quantity. Add sub-components to any line.
 */
export function BomEditor({
  value,
  defaultValue = [],
  onChange,
  productName,
  defaultBuildQty = 1,
  readOnly = false,
  className,
  ...props
}: BomEditorProps) {
  const { locale } = useLocale()
  const [lines, setLines] = useControllableState<readonly BomComponent[]>({
    value,
    defaultValue,
    onChange: onChange ? (l) => { onChange([...l]) } : undefined,
  })
  const [buildQty, setBuildQty] = useState<number>(defaultBuildQty)
  const [expanded, setExpanded] = useState<string[]>(() => allIds(lines))
  const ext = extendedQuantities(lines, buildQty)

  const toRows = (list: readonly BomComponent[]): TreeGridRow<BomRowData>[] =>
    list.map((l) => ({
      id: l.id,
      data: {
        item: l.item,
        description: l.description ?? '',
        qty: l.qty,
        uom: l.uom ?? '',
        scrapPercent: l.scrapPercent ?? null,
        extended: ext.get(l.id) ?? 0,
      },
      children: l.children?.length ? toRows(l.children) : undefined,
    }))

  const add = (parentId: string | null) => {
    const child: BomComponent = { id: newBomId(), item: '', qty: 1 }
    setLines(addChild(lines, parentId, child))
    if (parentId) setExpanded((e) => (e.includes(parentId) ? e : [...e, parentId]))
  }

  const columns: TreeGridColumn<BomRowData>[] = [
    { field: 'item', header: 'Item', editor: readOnly ? undefined : 'text', width: 220 },
    { field: 'description', header: 'Description', editor: readOnly ? undefined : 'text' },
    { field: 'qty', header: 'Qty per', type: 'number', editor: readOnly ? undefined : 'number', precision: 4, width: 90 },
    { field: 'uom', header: 'UoM', editor: readOnly ? undefined : 'text', width: 70 },
    { field: 'scrapPercent', header: 'Scrap %', type: 'number', editor: readOnly ? undefined : 'number', precision: 2, width: 80 },
    {
      field: 'extended',
      header: 'Extended qty',
      type: 'number',
      width: 110,
      format: (v) => formatNumber(Number(v), locale, { maximumFractionDigits: 4 }),
    },
  ]

  return (
    <div
      className={cx('erp-bom-editor', className)}
      {...props}
    >
      <div className='erp-bom-editor__header'>
        {productName && (
          <strong className='erp-bom-editor__product'>
            <Icon name='grid' /> {productName}
          </strong>
        )}
        <NumberField
          label='Build quantity'
          size='sm'
          precision={4}
          min={0}
          value={buildQty}
          onChange={(v) => {
            setBuildQty(v ?? 0)
          }}
          className='erp-bom-editor__build'
        />
        {!readOnly && (
          <Button
            size='sm'
            icon={<Icon name='add' />}
            onClick={() => {
              add(null)
            }}
          >
            Add component
          </Button>
        )}
      </div>
      {lines.length === 0 ? (
        <p className='erp-empty'>No components yet</p>
      ) : (
        <TreeGrid<BomRowData>
          aria-label={productName ? `Bill of materials for ${productName}` : 'Bill of materials'}
          rows={toRows(lines)}
          columns={columns}
          expanded={expanded}
          onExpandedChange={setExpanded}
          onCellsChange={
            readOnly
              ? undefined
              : (changes) => {
                  // One update for a whole paste or fill, so every changed cell is kept.
                  let next = lines
                  for (const { rowId, field, value: v } of changes) {
                    const patch: Partial<BomComponent> =
                      field === 'qty'
                        ? { qty: typeof v === 'number' ? v : 0 }
                        : field === 'scrapPercent'
                          ? { scrapPercent: typeof v === 'number' ? v : undefined }
                          : { [field]: typeof v === 'string' ? v : '' }
                    next = updateLine(next, rowId, patch)
                  }
                  setLines(next)
                }
          }
          renderActions={
            readOnly
              ? undefined
              : (row) => (
                  <span className='erp-bom-editor__actions'>
                    <IconButton
                      size='sm'
                      icon='add'
                      aria-label={`Add component under ${row.data.item || 'this line'}`}
                      tooltip={false}
                      onClick={() => {
                        add(row.id)
                      }}
                    />
                    <IconButton
                      size='sm'
                      icon='trash'
                      aria-label={`Remove ${row.data.item || 'line'}`}
                      tooltip={false}
                      onClick={() => {
                        setLines(removeLine(lines, row.id))
                      }}
                    />
                  </span>
                )
          }
        />
      )}
    </div>
  )
}
