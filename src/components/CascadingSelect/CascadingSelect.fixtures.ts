import type { Option } from '../../utils/types'
import type { CascadeLevel } from './CascadingSelect'

const countries: Option[] = [
  { key: 'ID', label: 'Indonesia' },
  { key: 'DE', label: 'Germany' },
]
const states: Record<string, Option[]> = {
  ID: [
    { key: 'JK', label: 'DKI Jakarta' },
    { key: 'JI', label: 'East Java' },
  ],
  DE: [
    { key: 'HH', label: 'Hamburg' },
    { key: 'BY', label: 'Bavaria' },
  ],
}
const cities: Record<string, Option[]> = {
  JK: [
    { key: 'JKT-C', label: 'Central Jakarta' },
    { key: 'JKT-S', label: 'South Jakarta' },
  ],
  JI: [
    { key: 'SBY', label: 'Surabaya' },
    { key: 'MLG', label: 'Malang' },
  ],
  HH: [{ key: 'HAM', label: 'Hamburg' }],
  BY: [
    { key: 'MUC', label: 'Munich' },
    { key: 'NUE', label: 'Nuremberg' },
  ],
}

/** Country → State → City. Cities load with a small fixed delay to show the loading state. */
export const addressLevels: CascadeLevel[] = [
  { key: 'country', label: 'Country', options: () => countries },
  { key: 'state', label: 'State', options: ([country]) => states[country ?? ''] ?? [] },
  {
    key: 'city',
    label: 'City',
    options: ([, state]) =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(cities[state ?? ''] ?? [])
        }, 200)
      }),
  },
]

/** Synchronous version for tests. */
export const syncAddressLevels: CascadeLevel[] = [
  { key: 'country', label: 'Country', options: () => countries },
  { key: 'state', label: 'State', options: ([country]) => states[country ?? ''] ?? [] },
  { key: 'city', label: 'City', options: ([, state]) => cities[state ?? ''] ?? [] },
]
