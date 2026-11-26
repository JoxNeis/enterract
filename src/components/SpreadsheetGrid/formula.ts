/** Raw cell contents keyed by A1 address. Formulas start with `=`. */
export type Sheet = Record<string, string>

export type CellValue = number | string | null
export type FormulaError = '#REF!' | '#DIV/0!' | '#CYCLE!' | '#ERROR!' | '#VALUE!' | '#NAME?'

export const isError = (v: unknown): v is FormulaError => typeof v === 'string' && v.startsWith('#')

/** 0 → A, 25 → Z, 26 → AA */
export function columnName(index: number): string {
  let n = index + 1
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export function parseAddress(ref: string): { col: number; row: number } | null {
  const m = /^([A-Z]+)(\d+)$/i.exec(ref.trim())
  if (!m) return null
  const letters = (m[1] ?? '').toUpperCase()
  let col = 0
  for (const ch of letters) col = col * 26 + (ch.charCodeAt(0) - 64)
  return { col: col - 1, row: Number(m[2]) - 1 }
}

export const address = (col: number, row: number) => `${columnName(col)}${String(row + 1)}`

/**
 * Moves the relative references of a formula by `dr` rows and `dc` columns, the way Excel does
 * when a formula is filled or copied (`=A1*2` one row down → `=A2*2`). `$` keeps a column or row
 * fixed (`$A$1`, `A$1`). References pushed off the sheet become `#REF!`. Plain values are unchanged.
 */
export function shiftFormula(raw: string, dr: number, dc: number): string {
  if (!raw.startsWith('=')) return raw
  return raw.replace(/(?<![A-Z$])(\$?)([A-Z]+)(\$?)(\d+)(?!\d|\s*\()/gi, (_m, colAbs: string, letters: string, rowAbs: string, digits: string) => {
    const p = parseAddress(`${letters}${digits}`)
    if (!p) return _m
    const col = colAbs ? p.col : p.col + dc
    const row = rowAbs ? p.row : p.row + dr
    if (col < 0 || row < 0) return '#REF!'
    return `${colAbs}${columnName(col)}${rowAbs}${String(row + 1)}`
  })
}

type Token = { t: 'num'; v: number } | { t: 'ref'; v: string } | { t: 'name'; v: string } | { t: 'op'; v: string }

function tokenize(src: string): Token[] | null {
  const tokens: Token[] = []
  const re = /\s*(?:(\d+(?:\.\d+)?)|(\$?[A-Z]+\$?\d+)|([A-Z]+)(?=\s*\()|([-+*/(),:]))/giy
  let m: RegExpExecArray | null
  let pos = 0
  while ((m = re.exec(src)) !== null) {
    pos = re.lastIndex
    if (m[1] !== undefined) tokens.push({ t: 'num', v: Number(m[1]) })
    else if (m[2] !== undefined) tokens.push({ t: 'ref', v: m[2].replace(/\$/g, '').toUpperCase() })
    else if (m[3] !== undefined) tokens.push({ t: 'name', v: m[3].toUpperCase() })
    else if (m[4] !== undefined) tokens.push({ t: 'op', v: m[4] })
  }
  return src.slice(pos).trim() === '' ? tokens : null
}

class Fail extends Error {
  code: FormulaError
  constructor(code: FormulaError) {
    super(code)
    this.code = code
  }
}

/** Evaluates every cell of a sheet. Circular references give `#CYCLE!`. */
export function evaluateSheet(sheet: Sheet): Record<string, CellValue> {
  const cache = new Map<string, CellValue>()
  const visiting = new Set<string>()

  const valueOf = (ref: string): CellValue => {
    const cached = cache.get(ref)
    if (cached !== undefined) return cached
    if (visiting.has(ref)) throw new Fail('#CYCLE!')
    visiting.add(ref)
    let result: CellValue
    try {
      result = computeCell(sheet[ref] ?? '')
    } catch (err) {
      result = err instanceof Fail ? err.code : '#ERROR!'
    }
    visiting.delete(ref)
    cache.set(ref, result)
    return result
  }

  const computeCell = (raw: string): CellValue => {
    const text = raw.trim()
    if (text === '') return null
    if (!text.startsWith('=')) {
      const n = Number(text)
      return /^-?\d+(\.\d+)?$/.test(text) && Number.isFinite(n) ? n : raw
    }
    if (text.includes('#REF!')) throw new Fail('#REF!')
    const tokens = tokenize(text.slice(1))
    if (!tokens || tokens.length === 0) throw new Fail('#ERROR!')
    let i = 0
    const peek = () => tokens[i]
    const isOp = (v: string) => {
      const t = peek()
      return t?.t === 'op' && t.v === v
    }
    const expect = (v: string) => {
      if (!isOp(v)) throw new Fail('#ERROR!')
      i++
    }
    const num = (v: CellValue): number => {
      if (v === null) return 0
      if (typeof v === 'number') return v
      if (isError(v)) throw new Fail(v)
      throw new Fail('#VALUE!')
    }
    const rangeValues = (a: string, b: string): CellValue[] => {
      const p = parseAddress(a)
      const q = parseAddress(b)
      if (!p || !q) throw new Fail('#REF!')
      const out: CellValue[] = []
      for (let r = Math.min(p.row, q.row); r <= Math.max(p.row, q.row); r++)
        for (let c = Math.min(p.col, q.col); c <= Math.max(p.col, q.col); c++) out.push(valueOf(address(c, r)))
      return out
    }
    const args = (): CellValue[] => {
      const list: CellValue[] = []
      expect('(')
      if (isOp(')')) {
        i++
        return list
      }
      for (;;) {
        const t = peek()
        const next = tokens[i + 1]
        if (t?.t === 'ref' && next?.t === 'op' && next.v === ':') {
          const end = tokens[i + 2]
          if (end?.t !== 'ref') throw new Fail('#ERROR!')
          list.push(...rangeValues(t.v, end.v))
          i += 3
        } else list.push(expr())
        if (isOp(',')) {
          i++
          continue
        }
        expect(')')
        return list
      }
    }
    const call = (name: string): number => {
      const values = args()
      const errors = values.find(isError)
      if (errors) throw new Fail(errors)
      const nums = values.filter((v): v is number => typeof v === 'number')
      switch (name) {
        case 'SUM':
          return nums.reduce((s, n) => s + n, 0)
        case 'AVG':
        case 'AVERAGE':
          if (!nums.length) throw new Fail('#DIV/0!')
          return nums.reduce((s, n) => s + n, 0) / nums.length
        case 'MIN':
          return nums.length ? Math.min(...nums) : 0
        case 'MAX':
          return nums.length ? Math.max(...nums) : 0
        case 'COUNT':
          return nums.length
        case 'ROUND': {
          const [x = 0, d = 0] = values.map(num)
          const f = 10 ** d
          return Math.round(x * f) / f
        }
        case 'ABS':
          return Math.abs(num(values[0] ?? null))
        default:
          throw new Fail('#NAME?')
      }
    }
    const factor = (): CellValue => {
      const t = tokens[i++]
      if (!t) throw new Fail('#ERROR!')
      if (t.t === 'num') return t.v
      if (t.t === 'ref') {
        if (!parseAddress(t.v)) throw new Fail('#REF!')
        return valueOf(t.v)
      }
      if (t.t === 'name') return call(t.v)
      if (t.v === '-') return -num(factor())
      if (t.v === '+') return num(factor())
      if (t.v === '(') {
        const v = expr()
        expect(')')
        return v
      }
      throw new Fail('#ERROR!')
    }
    const term = (): CellValue => {
      let v = factor()
      while (isOp('*') || isOp('/')) {
        const op = (tokens[i++] as { v: string }).v
        const rhs = num(factor())
        if (op === '/' && rhs === 0) throw new Fail('#DIV/0!')
        v = op === '*' ? num(v) * rhs : num(v) / rhs
      }
      return v
    }
    const expr = (): CellValue => {
      let v = term()
      while (isOp('+') || isOp('-')) {
        const op = (tokens[i++] as { v: string }).v
        const rhs = num(term())
        v = op === '+' ? num(v) + rhs : num(v) - rhs
      }
      return v
    }
    const result = expr()
    if (i !== tokens.length) throw new Fail('#ERROR!')
    return typeof result === 'number' ? Number(result.toPrecision(15)) : result
  }

  const out: Record<string, CellValue> = {}
  for (const ref of Object.keys(sheet)) out[ref] = valueOf(ref)
  return new Proxy(out, {
    get: (target, prop: string) => (prop in target ? target[prop] : valueOf(prop)),
  })
}
