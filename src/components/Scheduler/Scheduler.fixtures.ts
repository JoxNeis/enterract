import type { SchedulerEvent } from './Scheduler'

/** Week of 16–20 March 2026 (Monday–Friday). */
export const dockEvents: SchedulerEvent[] = [
  { id: 'e1', title: 'Inbound: Global Steel', start: '2026-03-16T08:00', end: '2026-03-16T09:30', location: 'Dock 1', category: 1 },
  { id: 'e2', title: 'Outbound: SO-1043', start: '2026-03-16T09:00', end: '2026-03-16T10:00', location: 'Dock 2', category: 2 },
  { id: 'e3', title: 'Forklift maintenance', start: '2026-03-17T13:00', end: '2026-03-17T15:00', category: 3 },
  { id: 'e4', title: 'Outbound: SO-1047', start: '2026-03-18T10:30', end: '2026-03-18T11:30', location: 'Dock 1', category: 2 },
  { id: 'e5', title: 'Stock count, aisle A', start: '2026-03-19T07:00', end: '2026-03-19T12:00', category: 4 },
  { id: 'e6', title: 'Inbound: Delta Foods', start: '2026-03-20T14:00', end: '2026-03-20T15:00', location: 'Dock 2', category: 1 },
]
