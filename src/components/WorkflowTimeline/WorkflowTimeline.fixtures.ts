import type { TimelineEvent } from './WorkflowTimeline'

export const timelineEvents: TimelineEvent[] = [
  { id: '1', title: 'Created', state: 'done', actor: 'Dewi Lestari', at: '2026-03-14T08:10:00Z' },
  { id: '2', title: 'Submitted for approval', state: 'done', actor: 'Dewi Lestari', at: '2026-03-14T09:00:00Z' },
  { id: '3', title: 'Approved by purchasing', state: 'done', actor: 'Rudi Hartono', at: '2026-03-15T09:10:00Z', comment: 'Prices match the framework agreement.' },
  { id: '4', title: 'Finance approval', state: 'current', actor: 'Anna Schmidt' },
  { id: '5', title: 'Post to ledger', state: 'pending' },
]
