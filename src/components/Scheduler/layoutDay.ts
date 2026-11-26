import type { SchedulerEvent } from './Scheduler'

export interface PlacedEvent {
  event: SchedulerEvent
  /** 0-based column within its overlap cluster. */
  lane: number
  /** Columns in the cluster. */
  lanes: number
}

/** Lays out overlapping events of one day side by side (greedy lanes per overlap cluster). */
export function layoutDay(events: readonly SchedulerEvent[]): PlacedEvent[] {
  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end))
  const placed: PlacedEvent[] = []
  let cluster: PlacedEvent[] = []
  let clusterEnd = ''
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((p) => p.lane + 1))
    for (const p of cluster) p.lanes = lanes
    placed.push(...cluster)
    cluster = []
    clusterEnd = ''
  }
  for (const event of sorted) {
    if (cluster.length && event.start >= clusterEnd) flush()
    const used = new Set(cluster.filter((p) => p.event.end > event.start).map((p) => p.lane))
    let lane = 0
    while (used.has(lane)) lane++
    cluster.push({ event, lane, lanes: 1 })
    if (event.end > clusterEnd) clusterEnd = event.end
  }
  flush()
  return placed
}
