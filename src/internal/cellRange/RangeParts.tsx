import type { MouseEvent } from 'react'
import { cx } from '../../utils/cx'
import { formatNumber } from '../../utils/number'
import type { RangeSummary } from './rangeOps'

/** The small square at the bottom-right of the selection; drag it to fill (like Excel). */
export function FillHandle({ onMouseDown }: { onMouseDown: (event: MouseEvent<HTMLElement>) => void }) {
  return (
    <span
      className='erp-fill-handle'
      aria-hidden='true'
      title='Drag to fill'
      onMouseDown={onMouseDown}
    />
  )
}

/** Excel status-bar text for a multi-cell selection: Average, Count and Sum. */
export function RangeSummaryText({ summary, locale, className }: { summary: RangeSummary | null; locale: string; className?: string }) {
  if (!summary || summary.count === 0) return null
  const fmt = (n: number) => formatNumber(n, locale, { maximumFractionDigits: 4 })
  return (
    <span
      className={cx('erp-range-summary', className)}
    >
      {summary.average !== null && <span>Average: {fmt(summary.average)}</span>}
      <span>Count: {fmt(summary.count)}</span>
      {summary.numericCount > 0 && <span>Sum: {fmt(summary.sum)}</span>}
    </span>
  )
}

/** Live region for clipboard messages plus the selection summary, under grids without a status bar. */
export function RangeStatusBar({
  message,
  summary,
  locale,
  className,
}: {
  message: string | null
  summary: RangeSummary | null
  locale: string
  className?: string
}) {
  return (
    <div className={cx('erp-range-status', className)}>
      <span
        role='status'
        aria-live='polite'
        className='erp-range-status__message'
        data-tone={message?.includes('could not') ? 'error' : undefined}
      >
        {message}
      </span>
      <RangeSummaryText
        summary={summary}
        locale={locale}
      />
    </div>
  )
}
