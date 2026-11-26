import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { formatNumber } from '../../utils/number'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import './KpiCard.css'

export interface KpiCardProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** What is measured, e.g. "Revenue (MTD)". */
  label: string
  /** Headline figure, already formatted (`$1.24M`) or a number. */
  value: ReactNode
  /** Change versus the comparison period as a fraction (0.12 = +12 %). */
  delta?: number
  /** e.g. "vs last month". */
  deltaLabel?: string
  /** Which direction is good. Costs and overdue amounts are good when they go down. */
  goodDirection?: 'up' | 'down'
  /** Recent values for a small trend line (oldest first). */
  trend?: readonly number[]
  /** Opens the detail behind the figure. */
  onDrill?: () => void
}

function Sparkline({ values }: { values: readonly number[] }) {
  if (values.length < 2) return null
  const w = 96
  const h = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => `${String((i / (values.length - 1)) * (w - 4) + 2)},${String(h - 2 - ((v - min) / span) * (h - 4))}`)
  const last = pts[pts.length - 1]?.split(',') ?? ['0', '0']
  return (
    <svg
      className='erp-kpi-card__spark'
      width={w}
      height={h}
      viewBox={`0 0 ${String(w)} ${String(h)}`}
      aria-hidden='true'
    >
      <polyline
        points={pts.join(' ')}
        fill='none'
        stroke='var(--erp-chart-1)'
        strokeWidth={2}
        strokeLinejoin='round'
        strokeLinecap='round'
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={3}
        fill='var(--erp-chart-1)'
      />
    </svg>
  )
}

/** A key figure with its change and trend (dashboard tile). */
export function KpiCard({
  label,
  value,
  delta,
  deltaLabel = 'vs previous period',
  goodDirection = 'up',
  trend,
  onDrill,
  className,
  ...props
}: KpiCardProps) {
  const { locale } = useLocale()
  const direction = delta === undefined || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down'
  const tone = direction === 'flat' ? 'neutral' : direction === goodDirection ? 'good' : 'bad'
  const pct = delta === undefined ? '' : `${delta > 0 ? '+' : ''}${formatNumber(delta * 100, locale, { maximumFractionDigits: 1 })} %`
  const trendText = trend && trend.length > 1 ? `Trend over ${String(trend.length)} periods, from ${formatNumber(trend[0] ?? 0, locale)} to ${formatNumber(trend[trend.length - 1] ?? 0, locale)}.` : ''

  const body = (
    <>
      <span className='erp-kpi-card__label'>{label}</span>
      <span className='erp-kpi-card__value'>{value}</span>
      <span className='erp-kpi-card__footer'>
        {delta !== undefined && (
          <span
            className='erp-kpi-card__delta'
            data-tone={tone}
          >
            <Icon name={direction === 'up' ? 'trend-up' : direction === 'down' ? 'trend-down' : 'arrow-right'} />
            {pct}
            <span className='erp-visually-hidden'>{tone === 'good' ? ' (improvement)' : tone === 'bad' ? ' (worse)' : ''}</span>
          </span>
        )}
        {delta !== undefined && <span className='erp-kpi-card__delta-label'>{deltaLabel}</span>}
        {trend && <Sparkline values={trend} />}
      </span>
      {trendText && <span className='erp-visually-hidden'>{trendText}</span>}
    </>
  )

  return (
    <section
      className={cx('erp-kpi-card', className)}
      aria-label={label}
      {...props}
    >
      {onDrill ? (
        <button
          type='button'
          className='erp-kpi-card__button'
          onClick={onDrill}
        >
          {body}
        </button>
      ) : (
        <div className='erp-kpi-card__content'>{body}</div>
      )}
    </section>
  )
}
