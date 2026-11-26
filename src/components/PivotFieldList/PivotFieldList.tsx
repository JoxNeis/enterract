import type { ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { useControllableState } from '../../utils/useControllableState'
import { IconButton } from '../IconButton'
import type { PivotAggregate, PivotConfig } from '../PivotGrid'
import { Select } from '../Select'
import './PivotFieldList.css'

export interface PivotFieldDef {
  key: string
  label: string
  /** Numeric fields can be summed; others only counted. */
  numeric?: boolean
}

export interface PivotFieldListProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  fields: readonly PivotFieldDef[]
  value?: PivotConfig
  defaultValue?: PivotConfig
  onChange?: (config: PivotConfig) => void
}

type Zone = 'rows' | 'columns'

const aggregates: { key: PivotAggregate; label: string }[] = [
  { key: 'sum', label: 'Sum' },
  { key: 'count', label: 'Count' },
  { key: 'avg', label: 'Average' },
  { key: 'min', label: 'Min' },
  { key: 'max', label: 'Max' },
]

/** Choose the rows, columns and values of a PivotGrid (keyboard-friendly, no drag needed). */
export function PivotFieldList({ fields, value, defaultValue = { rows: [], columns: [], values: [] }, onChange, className, ...props }: PivotFieldListProps) {
  const [config, setConfig] = useControllableState<PivotConfig>({
    value,
    defaultValue,
    onChange: onChange ? (c) => { onChange(c) } : undefined,
  })
  const label = (key: string) => fields.find((f) => f.key === key)?.label ?? key
  const used = new Set([...config.rows, ...config.columns])
  const available = fields.filter((f) => !used.has(f.key))

  const moveIn = (zone: Zone, key: string, dir: -1 | 1) => {
    const list = [...config[zone]]
    const i = list.indexOf(key)
    const j = i + dir
    const a = list[i]
    const b = list[j]
    if (a === undefined || b === undefined) return
    list[i] = b
    list[j] = a
    setConfig({ ...config, [zone]: list })
  }

  const zone = (z: Zone, title: string) => (
    <section
      className='erp-pivot-fields__zone'
      aria-label={title}
    >
      <h4 className='erp-pivot-fields__title'>{title}</h4>
      <ul className='erp-pivot-fields__list'>
        {config[z].map((key, i) => (
          <li key={key}>
            <span className='erp-pivot-fields__name'>{label(key)}</span>
            <IconButton
              size='sm'
              icon='arrow-up'
              aria-label={`Move ${label(key)} up in ${title}`}
              tooltip={false}
              disabled={i === 0}
              onClick={() => {
                moveIn(z, key, -1)
              }}
            />
            <IconButton
              size='sm'
              icon='close'
              aria-label={`Remove ${label(key)} from ${title}`}
              tooltip={false}
              onClick={() => {
                setConfig({ ...config, [z]: config[z].filter((k) => k !== key) })
              }}
            />
          </li>
        ))}
      </ul>
      <Select
        label={`Add to ${title}`}
        hideLabel
        size='sm'
        placeholder='Add field…'
        options={available.map((f) => ({ key: f.key, label: f.label }))}
        value={null}
        onChange={(key) => {
          if (key) setConfig({ ...config, [z]: [...config[z], key] })
        }}
      />
    </section>
  )

  return (
    <div
      className={cx('erp-pivot-fields', className)}
      {...props}
    >
      {zone('rows', 'Rows')}
      {zone('columns', 'Columns')}
      <section
        className='erp-pivot-fields__zone'
        aria-label='Values'
      >
        <h4 className='erp-pivot-fields__title'>Values</h4>
        <ul className='erp-pivot-fields__list'>
          {config.values.map((v, i) => (
            <li key={`${v.field}-${String(i)}`}>
              <span className='erp-pivot-fields__name'>{label(v.field)}</span>
              <Select<PivotAggregate>
                label={`Aggregate of ${label(v.field)}`}
                hideLabel
                size='sm'
                options={aggregates.filter((a) => (fields.find((f) => f.key === v.field)?.numeric ?? false) || a.key === 'count')}
                value={v.aggregate}
                onChange={(agg) => {
                  if (agg) setConfig({ ...config, values: config.values.map((x, j) => (j === i ? { ...x, aggregate: agg } : x)) })
                }}
              />
              <IconButton
                size='sm'
                icon='close'
                aria-label={`Remove ${label(v.field)} from Values`}
                tooltip={false}
                onClick={() => {
                  setConfig({ ...config, values: config.values.filter((_, j) => j !== i) })
                }}
              />
            </li>
          ))}
        </ul>
        <Select
          label='Add to Values'
          hideLabel
          size='sm'
          placeholder='Add value…'
          options={fields.map((f) => ({ key: f.key, label: f.label }))}
          value={null}
          onChange={(key) => {
            if (key) setConfig({ ...config, values: [...config.values, { field: key, aggregate: fields.find((f) => f.key === key)?.numeric ? 'sum' : 'count' }] })
          }}
        />
      </section>
    </div>
  )
}
