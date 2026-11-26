import { useEffect, useId, useRef, useState, type ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { formatNumber } from '../../utils/number'
import { useLocale } from '../LocaleProvider'
import { arcPath, barPath, linear, niceTicks, seriesColor } from './scale'
import './Chart.css'

export interface ChartSeries {
  name: string
  /** One value per category; `null` for a gap. */
  values: readonly (number | null)[]
}

export type ChartType = 'bar' | 'stacked-bar' | 'line' | 'area' | 'pie' | 'donut'

export interface ChartProps extends Omit<ComponentProps<'figure'>, 'title'> {
  type: ChartType
  /** Chart title. Also the accessible name. */
  title: string
  /** X-axis categories (months, regions…). Pie/donut: slice names. */
  categories: readonly string[]
  /** Up to 8 series; more are folded into "Other". Pie/donut use the first series. */
  series: readonly ChartSeries[]
  /** Plot height in px. */
  height?: number
  /** Value formatting (currency, percent…). */
  valueFormat?: Intl.NumberFormatOptions
  /** Show a "Show table" toggle (on by default, the accessible alternative). */
  allowTable?: boolean
  /** Caption under the chart (source, notes). */
  caption?: string
  /** Label the last point of each line/area series with its name. */
  directLabels?: boolean
}

const MAX_SERIES = 8
const MARGIN = { top: 12, right: 16, bottom: 28, left: 56 }

function foldSeries(series: readonly ChartSeries[]): ChartSeries[] {
  if (series.length <= MAX_SERIES) return [...series]
  const keep = series.slice(0, MAX_SERIES - 1)
  const rest = series.slice(MAX_SERIES - 1)
  const length = Math.max(...rest.map((s) => s.values.length))
  const other = Array.from({ length }, (_, i) => rest.reduce((sum, s) => sum + (s.values[i] ?? 0), 0))
  return [...keep, { name: 'Other', values: other }]
}

interface Tip {
  x: number
  y: number
  title: string
  rows: { name: string; value: string; color: string }[]
}

/**
 * Bar, stacked bar, line, area, pie and donut charts in plain SVG (no charting dependency).
 * One value axis, colorblind-validated palette in fixed order, a legend for 2+ series,
 * keyboard-focusable data points with tooltips, and a table view.
 */
export function Chart({
  type,
  title,
  categories,
  series: seriesProp,
  height = 260,
  valueFormat,
  allowTable = true,
  caption,
  directLabels = false,
  className,
  ...props
}: ChartProps) {
  const { locale } = useLocale()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [tip, setTip] = useState<Tip | null>(null)
  const [showTable, setShowTable] = useState(false)
  const id = useId()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setWidth(Math.max(240, Math.round(w)))
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [])

  const series = foldSeries(seriesProp)
  const fmt = (v: number | null) => (v === null ? '—' : new Intl.NumberFormat(locale, valueFormat).format(v))
  const fmtAxis = (v: number) =>
    new Intl.NumberFormat(locale, { ...valueFormat, notation: Math.abs(v) >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(v)
  const isPie = type === 'pie' || type === 'donut'
  const stacked = type === 'stacked-bar'

  const innerW = width - MARGIN.left - MARGIN.right
  const innerH = height - MARGIN.top - MARGIN.bottom
  const values = stacked
    ? categories.map((_, i) => series.reduce((s, ser) => s + Math.max(0, ser.values[i] ?? 0), 0))
    : series.flatMap((s) => s.values.filter((v): v is number => v !== null))
  const minV = stacked ? 0 : Math.min(0, ...values)
  const ticks = niceTicks(minV, Math.max(0, ...values))
  const lo = ticks[0] ?? 0
  const hi = ticks[ticks.length - 1] ?? 1
  const y = linear([lo, hi], [MARGIN.top + innerH, MARGIN.top])
  const band = innerW / Math.max(1, categories.length)
  const xCenter = (i: number) => MARGIN.left + band * i + band / 2
  const baseline = y(0)

  const tipFor = (i: number, x: number, yy: number): Tip => ({
    x,
    y: yy,
    title: categories[i] ?? '',
    rows: series.map((s, si) => ({ name: s.name, value: fmt(s.values[i] ?? null), color: seriesColor(si) })),
  })
  const pointLabel = (i: number) =>
    `${categories[i] ?? ''}: ${series.map((s) => `${s.name} ${fmt(s.values[i] ?? null)}`).join(', ')}`

  const renderCartesian = () => {
    const groupW = band * 0.72
    const barW = stacked ? groupW : Math.max(2, (groupW - 2 * (series.length - 1)) / Math.max(1, series.length))
    return (
      <>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={MARGIN.left}
              x2={MARGIN.left + innerW}
              y1={y(t)}
              y2={y(t)}
              className={t === 0 ? 'erp-chart__baseline' : 'erp-chart__grid'}
            />
            <text
              x={MARGIN.left - 8}
              y={y(t)}
              className='erp-chart__tick'
              textAnchor='end'
              dominantBaseline='middle'
            >
              {fmtAxis(t)}
            </text>
          </g>
        ))}
        {categories.map((c, i) => (
          <text
            key={c}
            x={xCenter(i)}
            y={height - 8}
            className='erp-chart__tick'
            textAnchor='middle'
          >
            {c}
          </text>
        ))}
        {(type === 'bar' || stacked) &&
          categories.map((c, i) => {
            const x0 = xCenter(i) - groupW / 2
            let acc = 0
            return (
              <g key={c}>
                {series.map((s, si) => {
                  const v = s.values[i] ?? null
                  if (v === null || v === 0) return null
                  if (stacked) {
                    const yTop = y(acc + v)
                    const yBottom = y(acc) - (acc > 0 ? 2 : 0)
                    acc += v
                    const last = series.slice(si + 1).every((n) => !n.values[i])
                    return (
                      <path
                        key={s.name}
                        d={last ? barPath(x0, yBottom, yTop, barW) : `M${String(x0)},${String(yBottom)}V${String(yTop)}H${String(x0 + barW)}V${String(yBottom)}Z`}
                        fill={seriesColor(si)}
                      />
                    )
                  }
                  return (
                    <path
                      key={s.name}
                      d={barPath(x0 + si * (barW + 2), baseline, y(v), barW)}
                      fill={seriesColor(si)}
                    />
                  )
                })}
              </g>
            )
          })}
        {(type === 'line' || type === 'area') &&
          series.map((s, si) => {
            const pts = s.values.map((v, i) => (v === null ? null : ([xCenter(i), y(v)] as const)))
            const segments: string[] = []
            let current = ''
            pts.forEach((p) => {
              if (!p) {
                if (current) segments.push(current)
                current = ''
                return
              }
              current += `${current ? 'L' : 'M'}${String(p[0])},${String(p[1])}`
            })
            if (current) segments.push(current)
            const lastIndex = pts.map((p, i) => (p ? i : -1)).filter((i) => i >= 0).pop()
            return (
              <g key={s.name}>
                {type === 'area' &&
                  segments.map((seg) => {
                    const xs = seg.match(/[ML]([\d.]+),/g)?.map((m) => m.slice(1, -1)) ?? []
                    return (
                      <path
                        key={`a${seg}`}
                        d={`${seg}L${xs[xs.length - 1] ?? '0'},${String(baseline)}L${xs[0] ?? '0'},${String(baseline)}Z`}
                        fill={seriesColor(si)}
                        opacity={0.14}
                      />
                    )
                  })}
                {segments.map((seg) => (
                  <path
                    key={seg}
                    d={seg}
                    fill='none'
                    stroke={seriesColor(si)}
                    strokeWidth={2}
                    strokeLinejoin='round'
                    strokeLinecap='round'
                  />
                ))}
                {directLabels && lastIndex !== undefined && (
                  <text
                    x={xCenter(lastIndex) + 6}
                    y={y(s.values[lastIndex] ?? 0)}
                    className='erp-chart__direct-label'
                    dominantBaseline='middle'
                  >
                    {s.name}
                  </text>
                )}
              </g>
            )
          })}
        {tip && (type === 'line' || type === 'area') && (
          <line
            className='erp-chart__crosshair'
            x1={tip.x}
            x2={tip.x}
            y1={MARGIN.top}
            y2={MARGIN.top + innerH}
          />
        )}
        {tip &&
          (type === 'line' || type === 'area') &&
          series.map((s, si) => {
            const i = categories.indexOf(tip.title)
            const v = s.values[i] ?? null
            return v === null ? null : (
              <circle
                key={s.name}
                cx={tip.x}
                cy={y(v)}
                r={4}
                fill={seriesColor(si)}
                className='erp-chart__marker'
              />
            )
          })}
        {categories.map((c, i) => (
          <rect
            key={c}
            x={MARGIN.left + band * i}
            y={MARGIN.top}
            width={band}
            height={innerH}
            className='erp-chart__hit'
            tabIndex={0}
            role='img'
            aria-label={pointLabel(i)}
            onMouseEnter={() => {
              setTip(tipFor(i, xCenter(i), MARGIN.top))
            }}
            onFocus={() => {
              setTip(tipFor(i, xCenter(i), MARGIN.top))
            }}
            onMouseLeave={() => {
              setTip(null)
            }}
            onBlur={() => {
              setTip(null)
            }}
          />
        ))}
      </>
    )
  }

  const pieNamesOf = (i: number) => (categories.length > MAX_SERIES && i === MAX_SERIES - 1 ? 'Other' : (categories[i] ?? ''))
  const renderPie = () => {
    const all = series[0]?.values.map((v) => Math.max(0, v ?? 0)) ?? []
    // Never cycle colors: slices past 8 fold into "Other".
    const data = all.length > MAX_SERIES ? [...all.slice(0, MAX_SERIES - 1), all.slice(MAX_SERIES - 1).reduce((a, b) => a + b, 0)] : all
    const total = data.reduce((s, v) => s + v, 0) || 1
    const r = Math.min(innerH + MARGIN.top, width) / 2 - 8
    const cxp = width / 2
    const cyp = height / 2
    let a = 0
    return data.map((v, i) => {
      const a0 = a
      a += (v / total) * Math.PI * 2
      const mid = (a0 + a) / 2
      const label = `${pieNamesOf(i)}: ${fmt(v)} (${formatNumber((v / total) * 100, locale, { maximumFractionDigits: 1 })} %)`
      return (
        <path
          key={categories[i] ?? String(i)}
          d={arcPath(cxp, cyp, r, type === 'donut' ? r * 0.6 : 0, a0, a)}
          fill={seriesColor(i)}
          className='erp-chart__slice'
          tabIndex={0}
          role='img'
          aria-label={label}
          onMouseEnter={() => {
            setTip({ x: cxp + (r / 2) * Math.sin(mid), y: cyp - (r / 2) * Math.cos(mid), title: pieNamesOf(i), rows: [{ name: series[0]?.name ?? '', value: label.split(': ')[1] ?? '', color: seriesColor(i) }] })
          }}
          onFocus={() => {
            setTip({ x: cxp + (r / 2) * Math.sin(mid), y: cyp - (r / 2) * Math.cos(mid), title: pieNamesOf(i), rows: [{ name: series[0]?.name ?? '', value: label.split(': ')[1] ?? '', color: seriesColor(i) }] })
          }}
          onMouseLeave={() => {
            setTip(null)
          }}
          onBlur={() => {
            setTip(null)
          }}
        />
      )
    })
  }

  const pieNames = categories.length > MAX_SERIES ? [...categories.slice(0, MAX_SERIES - 1), 'Other'] : [...categories]
  const legendItems = isPie ? pieNames : series.map((s) => s.name)
  const showLegend = isPie || series.length >= 2

  return (
    <figure
      className={cx('erp-chart', className)}
      aria-labelledby={`${id}-title`}
      {...props}
    >
      <div className='erp-chart__header'>
        <figcaption
          id={`${id}-title`}
          className='erp-chart__title'
        >
          {title}
        </figcaption>
        {allowTable && (
          <button
            type='button'
            className='erp-chart__table-toggle'
            aria-pressed={showTable}
            onClick={() => {
              setShowTable(!showTable)
            }}
          >
            {showTable ? 'Show chart' : 'Show table'}
          </button>
        )}
      </div>
      {showLegend && !showTable && (
        <ul
          className='erp-chart__legend'
          aria-label='Legend'
        >
          {legendItems.map((name, i) => (
            <li key={name}>
              <span
                className='erp-chart__swatch'
                style={{ background: seriesColor(i) }}
                data-shape={type === 'line' ? 'line' : 'square'}
                aria-hidden='true'
              />
              {name}
            </li>
          ))}
        </ul>
      )}
      <div
        ref={wrapRef}
        className='erp-chart__plot'
        hidden={showTable}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${String(width)} ${String(height)}`}
          role='group'
          aria-label={title}
        >
          {isPie ? renderPie() : renderCartesian()}
        </svg>
        {tip && (
          <div
            className='erp-chart__tooltip'
            role='status'
            style={{ left: Math.min(tip.x + 12, width - 180), top: tip.y }}
          >
            <div className='erp-chart__tooltip-title'>{tip.title}</div>
            {tip.rows.map((row) => (
              <div
                key={row.name}
                className='erp-chart__tooltip-row'
              >
                <span
                  className='erp-chart__swatch'
                  style={{ background: row.color }}
                  aria-hidden='true'
                />
                <span>{row.name}</span>
                <span className='erp-chart__tooltip-value'>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {showTable && (
        <table className='erp-chart__table'>
          <thead>
            <tr>
              <th scope='col'>{isPie ? 'Category' : ''}</th>
              {series.map((s) => (
                <th
                  key={s.name}
                  scope='col'
                >
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((c, i) => (
              <tr key={c}>
                <th scope='row'>{c}</th>
                {series.map((s) => (
                  <td key={s.name}>{fmt(s.values[i] ?? null)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {caption && <p className='erp-chart__caption'>{caption}</p>}
    </figure>
  )
}
