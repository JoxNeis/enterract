import type { ActivityEntry } from './ActivityFeed'

export const activity: ActivityEntry[] = [
  {
    id: 'a1',
    actor: 'Dewi Lestari',
    action: 'created',
    target: 'SO-2026-1043',
    at: '2026-03-14T08:10:00Z',
    type: 'create',
  },
  {
    id: 'a2',
    actor: 'Dewi Lestari',
    action: 'changed',
    target: 'line 2',
    at: '2026-03-14T08:42:00Z',
    type: 'edit',
    changes: [
      { field: 'Quantity', from: '80', to: '100' },
      { field: 'Delivery date', from: 'Mar 20, 2026', to: 'Mar 22, 2026' },
    ],
  },
  {
    id: 'a3',
    actor: 'Rudi Hartono',
    action: 'approved',
    target: 'SO-2026-1043',
    at: '2026-03-15T09:10:00Z',
    type: 'status',
  },
  {
    id: 'a4',
    actor: 'Markus Weber',
    action: 'changed',
    target: 'shipping address',
    at: '2026-03-15T11:30:00Z',
    type: 'edit',
    changes: [{ field: 'City', from: 'Bandung', to: 'Jakarta' }],
  },
]
