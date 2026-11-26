import type { Allocation, PlannerResource } from './ResourcePlanner'

export const consultants: PlannerResource[] = [
  { id: 'r1', name: 'Dewi Lestari', role: 'Finance consultant', capacity: 8 },
  { id: 'r2', name: 'Markus Weber', role: 'Logistics consultant', capacity: 8 },
  { id: 'r3', name: 'Siti Rahma', role: 'Developer', capacity: 6 },
]

/** Two weeks starting Monday 16 March 2026. */
export const bookings: Allocation[] = [
  { id: 'a1', resourceId: 'r1', title: 'Acme rollout', start: '2026-03-16', end: '2026-03-20', hours: 6, category: 1 },
  { id: 'a2', resourceId: 'r1', title: 'Support', start: '2026-03-18', end: '2026-03-19', hours: 4, category: 2 },
  { id: 'a3', resourceId: 'r2', title: 'Delta WMS', start: '2026-03-17', end: '2026-03-26', hours: 8, category: 3 },
  { id: 'a4', resourceId: 'r3', title: 'Interfaces', start: '2026-03-16', end: '2026-03-24', hours: 3, category: 4 },
]
