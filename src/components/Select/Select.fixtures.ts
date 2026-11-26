import type { Option } from '../../utils/types'

export const uomOptions: Option[] = [
  { key: 'PCS', label: 'Pieces', description: 'PCS' },
  { key: 'BOX', label: 'Box', description: 'BOX (12 PCS)' },
  { key: 'KG', label: 'Kilogram', description: 'KG' },
  { key: 'M', label: 'Meter', description: 'M' },
  { key: 'L', label: 'Liter', description: 'L', disabled: true },
]

export const warehouseOptions: Option[] = [
  { key: 'JKT-01', label: 'Jakarta Main', group: 'Indonesia' },
  { key: 'JKT-02', label: 'Jakarta Cikarang', group: 'Indonesia' },
  { key: 'SBY-01', label: 'Surabaya', group: 'Indonesia' },
  { key: 'SG-01', label: 'Singapore Jurong', group: 'Singapore' },
  { key: 'DE-01', label: 'Hamburg Port', group: 'Germany' },
  { key: 'DE-02', label: 'Munich', group: 'Germany' },
  { key: 'US-01', label: 'Newark', group: 'United States' },
  { key: 'US-02', label: 'Los Angeles', group: 'United States' },
]

export const cityNames = ['Jakarta', 'Bandung', 'Surabaya', 'Semarang', 'Medan', 'Makassar', 'Denpasar', 'Yogyakarta']
