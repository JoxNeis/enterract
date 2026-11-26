import type { ChartSeries } from './Chart'

export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

export const revenueVsCost: ChartSeries[] = [
  { name: 'Revenue', values: [182000, 196500, 214300, 205800, 231200, 248900] },
  { name: 'Cost of sales', values: [121000, 128400, 139900, 137100, 150300, 158800] },
]

export const salesByRegion: ChartSeries[] = [
  { name: 'Jakarta', values: [84, 91, 97, 102, 110, 118] },
  { name: 'Surabaya', values: [42, 45, 44, 48, 51, 55] },
  { name: 'Hamburg', values: [38, 36, 41, 43, 40, 46] },
]

export const regions = ['Jakarta', 'Surabaya', 'Bandung', 'Hamburg', 'Singapore']
export const shareByRegion: ChartSeries[] = [{ name: 'Revenue share', values: [41, 18, 12, 17, 12] }]
