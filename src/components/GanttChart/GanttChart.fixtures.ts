import type { GanttTask } from './GanttChart'

export const projectTasks: GanttTask[] = [
  { id: 't1', name: 'Requirements', start: '2026-03-02', end: '2026-03-06', progress: 1 },
  { id: 't2', name: 'Data migration design', start: '2026-03-09', end: '2026-03-13', progress: 0.6, dependsOn: ['t1'] },
  { id: 't3', name: 'Configure finance module', start: '2026-03-09', end: '2026-03-20', progress: 0.3, dependsOn: ['t1'] },
  { id: 't4', name: 'User training', start: '2026-03-23', end: '2026-03-27', progress: 0, dependsOn: ['t2', 't3'] },
  { id: 'm1', name: 'Go-live', start: '2026-03-30', end: '2026-03-30', milestone: true, dependsOn: ['t4'] },
]
