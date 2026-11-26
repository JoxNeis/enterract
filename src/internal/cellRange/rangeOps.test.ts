import { describe, expect, it } from 'vitest'
import { edgesOf, extendFill, fillShortcut, fillTargets, pastedRange, pasteTargets, summarize, toRange } from './rangeOps'

const one = { r0: 1, r1: 1, c0: 1, c1: 1 }

describe('range helpers', () => {
  it('normalizes ranges and finds outer edges', () => {
    const range = toRange({ r: 3, c: 2 }, { r: 1, c: 0 })
    expect(range).toEqual({ r0: 1, r1: 3, c0: 0, c1: 2 })
    expect(edgesOf(range, 1, 0)).toBe('t l')
    expect(edgesOf(range, 3, 2)).toBe('r b')
    expect(edgesOf(range, 2, 1)).toBeUndefined()
    expect(edgesOf(range, 0, 0)).toBeUndefined()
    expect(edgesOf(one, 1, 1)).toBe('t r b l')
  })
})

describe('pasteTargets', () => {
  it('places a block at the top-left of the selection', () => {
    expect(pasteTargets([['a', 'b'], ['c']], one)).toEqual([
      { r: 1, c: 1, text: 'a' },
      { r: 1, c: 2, text: 'b' },
      { r: 2, c: 1, text: 'c' },
    ])
    expect(pastedRange([['a', 'b'], ['c']], one)).toEqual({ r0: 1, r1: 2, c0: 1, c1: 2 })
  })

  it('fills the selection with a single value', () => {
    const range = { r0: 0, r1: 1, c0: 0, c1: 1 }
    expect(pasteTargets([['x']], range).map((t) => `${String(t.r)}${String(t.c)}${t.text}`)).toEqual(['00x', '01x', '10x', '11x'])
    expect(pastedRange([['x']], range)).toEqual(range)
  })

  it('tiles a block over a selection that is an exact multiple of it', () => {
    const range = { r0: 0, r1: 3, c0: 0, c1: 0 }
    expect(pasteTargets([['a'], ['b']], range).map((t) => t.text)).toEqual(['a', 'b', 'a', 'b'])
    // Not a multiple: placed once.
    expect(pasteTargets([['a'], ['b']], { r0: 0, r1: 2, c0: 0, c1: 0 }).map((t) => t.text)).toEqual(['a', 'b'])
  })
})

describe('fill', () => {
  const values: Record<string, number | string> = { '0:0': 1, '1:0': 2, '0:1': 'Box', '1:1': 'Pallet', '0:2': 5 }
  const get = (r: number, c: number) => values[`${String(r)}:${String(c)}`] ?? null
  const text = (r: number, c: number) => {
    const v = get(r, c)
    return v === null ? '' : String(v)
  }

  it('continues numeric series and repeats other patterns down', () => {
    const out = fillTargets({ r0: 0, r1: 1, c0: 0, c1: 2 }, { r0: 0, r1: 3, c0: 0, c1: 2 }, get, text)
    const at = (r: number, c: number) => out.find((t) => t.r === r && t.c === c)
    expect(at(2, 0)).toMatchObject({ value: 3, text: '3', series: true })
    expect(at(3, 0)).toMatchObject({ value: 4 })
    expect(at(2, 1)).toMatchObject({ text: 'Box', from: { r: 0, c: 1 } })
    expect(at(3, 1)).toMatchObject({ text: 'Pallet', from: { r: 1, c: 1 } })
    // 5 then empty is not a series: the pattern repeats.
    expect(at(2, 2)).toMatchObject({ text: '5', value: 5 })
    expect(at(3, 2)).toMatchObject({ text: '' })
  })

  it('fills upwards and to the right', () => {
    const up = fillTargets({ r0: 2, r1: 3, c0: 0, c1: 0 }, { r0: 0, r1: 3, c0: 0, c1: 0 }, (r) => (r === 2 ? 10 : 20), () => '')
    expect(up.map((t) => [t.r, t.value])).toEqual([
      [0, -10],
      [1, 0],
    ])
    const right = fillTargets({ r0: 0, r1: 0, c0: 0, c1: 0 }, { r0: 0, r1: 0, c0: 0, c1: 2 }, () => 'x', () => 'x')
    expect(right.map((t) => [t.c, t.text])).toEqual([
      [1, 'x'],
      [2, 'x'],
    ])
  })

  it('extends the fill range along the axis the pointer moved furthest', () => {
    const source = { r0: 1, r1: 2, c0: 1, c1: 1 }
    expect(extendFill(source, { r: 5, c: 2 })).toEqual({ r0: 1, r1: 5, c0: 1, c1: 1 })
    expect(extendFill(source, { r: 2, c: 4 })).toEqual({ r0: 1, r1: 2, c0: 1, c1: 4 })
    expect(extendFill(source, { r: 0, c: 1 })).toEqual({ r0: 0, r1: 2, c0: 1, c1: 1 })
    expect(extendFill(source, { r: 2, c: 1 })).toBeNull()
  })

  it('plans Ctrl+D and Ctrl+R', () => {
    expect(fillShortcut({ r0: 0, r1: 3, c0: 0, c1: 1 }, 'down')).toEqual({
      source: { r0: 0, r1: 0, c0: 0, c1: 1 },
      target: { r0: 0, r1: 3, c0: 0, c1: 1 },
    })
    expect(fillShortcut({ r0: 2, r1: 2, c0: 1, c1: 1 }, 'down')).toEqual({
      source: { r0: 1, r1: 1, c0: 1, c1: 1 },
      target: { r0: 1, r1: 2, c0: 1, c1: 1 },
    })
    expect(fillShortcut({ r0: 0, r1: 0, c0: 0, c1: 0 }, 'down')).toBeNull()
    expect(fillShortcut({ r0: 0, r1: 0, c0: 2, c1: 2 }, 'right')?.source).toEqual({ r0: 0, r1: 0, c0: 1, c1: 1 })
  })
})

describe('summarize', () => {
  it('counts non-empty cells and sums numbers, including decimal strings', () => {
    expect(summarize([1, '2.50', 'Box', null, '', true, [], 4])).toEqual({
      count: 5,
      numericCount: 3,
      sum: 7.5,
      average: 2.5,
      min: 1,
      max: 4,
    })
    expect(summarize(['a', 'b'])).toMatchObject({ count: 2, numericCount: 0, average: null })
  })
})
