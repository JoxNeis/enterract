import { useMemo, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { currencyDigits, formatDecimal } from '../../utils/decimal'
import { DataGrid, type DataGridProps, type FieldOf, type GridColumn, type GridRow } from '../DataGrid'
import { useLocale } from '../LocaleProvider'
import { computeTotals, lineAmount, type LineAmountInput } from './lineTotals'
import '../DataGrid/DataGrid.css'
import './LineItemGrid.css'

export interface LineItemGridProps<TData, TMeta = undefined> extends Omit<DataGridProps<TData, TMeta>, 'showFooter'> {
  /** Numeric quantity field. */
  quantityField: FieldOf<TData>
  /** Unit price field (decimal string). */
  priceField: FieldOf<TData>
  /** Discount percent field (number, 10 = 10%). */
  discountField?: FieldOf<TData>
  /** Boolean field; lines with `false` are not taxed. */
  taxableField?: FieldOf<TData>
  /** Tax rate as a decimal fraction, e.g. `"0.11"`. */
  taxRate?: string
  taxLabel?: ReactNode
  /** Currency for amounts. Defaults to the LocaleProvider currency. */
  currency?: string
  amountLabel?: string
  /** Shows subtotal, discount, tax and total under the grid. */
  showTotals?: boolean
}

/**
 * Order and invoice lines: a DataGrid with a computed Amount column (quantity × price − discount)
 * and a totals summary. Add row and delete are on by default. All money math is exact.
 */
export function LineItemGrid<TData, TMeta = undefined>({
  quantityField,
  priceField,
  discountField,
  taxableField,
  taxRate = '0',
  taxLabel,
  currency: currencyProp,
  amountLabel = 'Amount',
  showTotals = true,
  columns,
  rows,
  allowAdd = true,
  allowDelete = true,
  className,
  locale: localeProp,
  ...props
}: LineItemGridProps<TData, TMeta>) {
  const settings = useLocale(localeProp)
  const currency = currencyProp ?? settings.currency
  const scale = currencyDigits(currency)

  const toLine = (row: GridRow<TData, TMeta>): LineAmountInput => ({
    quantity: row.data[quantityField] as number | null,
    price: row.data[priceField] as string | null,
    discountPercent: discountField ? (row.data[discountField] as number | null) : null,
    taxable: taxableField ? (row.data[taxableField] as boolean | null) : true,
  })

  const allColumns = useMemo<GridColumn<TData, TMeta>[]>(
    () => [
      ...columns,
      {
        id: 'amount',
        field: priceField,
        header: amountLabel,
        editor: 'currency',
        currency,
        width: 130,
        value: (row) => lineAmount(toLine(row), scale),
        aggregate: 'sum',
      },
    ],
    // toLine depends only on the field props listed here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, priceField, quantityField, discountField, taxableField, amountLabel, currency, scale]
  )

  const totals = computeTotals(
    rows.filter((r) => r.status !== 'deleted').map(toLine),
    taxRate,
    scale
  )
  const money = (v: string) => formatDecimal(v, settings.locale, { currency })
  const rate = Number(taxRate) * 100

  return (
    <div className={cx('erp-line-item-grid', className)}>
      <DataGrid<TData, TMeta>
        {...props}
        locale={localeProp}
        rows={rows}
        columns={allColumns}
        allowAdd={allowAdd}
        allowDelete={allowDelete}
      />
      {showTotals && (
        <dl
          className='erp-line-item-grid__totals'
          aria-label='Totals'
        >
          {totals.discount !== '0' && !/^0\.0*$/.test(totals.discount) && (
            <>
              <dt>Discount</dt>
              <dd>-{money(totals.discount)}</dd>
            </>
          )}
          <dt>Subtotal</dt>
          <dd>{money(totals.subtotal)}</dd>
          <dt>{taxLabel ?? `Tax (${String(rate)}%)`}</dt>
          <dd>{money(totals.tax)}</dd>
          <dt className='erp-line-item-grid__grand'>Total</dt>
          <dd className='erp-line-item-grid__grand'>{money(totals.total)}</dd>
        </dl>
      )}
    </div>
  )
}
