import { addDays, addMonths, endOfMonth, startOfMonth } from '../../utils/date'

export interface DateRange {
  from: string | null
  to: string | null
}

export interface DateRangePreset {
  key: string
  label: string
  /** Range for a given "today" (ISO). */
  range: (today: string) => DateRange
}

function quarterStart(iso: string) {
  const month = Number(iso.slice(5, 7))
  const q = Math.floor((month - 1) / 3) * 3 + 1
  return `${iso.slice(0, 4)}-${String(q).padStart(2, '0')}-01`
}

/** Common ERP ranges. Pass your own list (e.g. fiscal quarters) with the `presets` prop. */
export const defaultRangePresets: DateRangePreset[] = [
  { key: 'today', label: 'Today', range: (t) => ({ from: t, to: t }) },
  { key: 'last7', label: 'Last 7 days', range: (t) => ({ from: addDays(t, -6), to: t }) },
  { key: 'last30', label: 'Last 30 days', range: (t) => ({ from: addDays(t, -29), to: t }) },
  { key: 'thisMonth', label: 'This month', range: (t) => ({ from: startOfMonth(t), to: endOfMonth(t) }) },
  {
    key: 'lastMonth',
    label: 'Last month',
    range: (t) => {
      const m = addMonths(startOfMonth(t), -1)
      return { from: m, to: endOfMonth(m) }
    },
  },
  {
    key: 'thisQuarter',
    label: 'This quarter',
    range: (t) => {
      const q = quarterStart(t)
      return { from: q, to: endOfMonth(addMonths(q, 2)) }
    },
  },
  {
    key: 'lastQuarter',
    label: 'Last quarter',
    range: (t) => {
      const q = addMonths(quarterStart(t), -3)
      return { from: q, to: endOfMonth(addMonths(q, 2)) }
    },
  },
  { key: 'ytd', label: 'Year to date', range: (t) => ({ from: `${t.slice(0, 4)}-01-01`, to: t }) },
  {
    key: 'lastYear',
    label: 'Last year',
    range: (t) => {
      const y = String(Number(t.slice(0, 4)) - 1)
      return { from: `${y}-01-01`, to: `${y}-12-31` }
    },
  },
]
