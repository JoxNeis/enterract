import type { TimelineItem } from './Timeline'

export const contractMilestones: TimelineItem[] = [
  { id: 'm1', date: '2026-01-15', title: 'Contract signed', status: 'done' },
  { id: 'm2', date: '2026-02-20', title: 'Design approved', status: 'done' },
  { id: 'm3', date: '2026-03-30', title: 'Go-live', status: 'at-risk', description: 'Training is behind plan' },
  { id: 'm4', date: '2026-05-15', title: 'First audit', status: 'planned' },
  { id: 'm5', date: '2026-06-30', title: 'Warranty ends', status: 'planned' },
]
