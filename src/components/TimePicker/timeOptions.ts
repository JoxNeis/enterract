/** All times from 00:00 in `step`-minute increments within min/max. */
export function timeOptions(step: number, min = '00:00', max = '23:59'): string[] {
  const out: string[] = []
  for (let m = 0; m < 24 * 60; m += step) {
    const t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    if (t >= min && t <= max) out.push(t)
  }
  return out
}
