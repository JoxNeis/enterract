import { normalizeDecimalText } from '../../utils/number'

/**
 * Evaluates `+ - * / ( )` arithmetic on locale numbers, e.g. `12*3,5` in de-DE. A recursive
 * descent parser: no `eval`, no variables, no functions. Returns null for invalid input or
 * division by zero.
 */
export function evaluateExpression(input: string, locale = 'en-US'): number | null {
  const tokens = tokenize(input, locale)
  if (!tokens) return null
  let pos = 0
  const peek = () => tokens[pos]
  const next = () => tokens[pos++]

  const factor = (): number | null => {
    const t = next()
    if (t === undefined) return null
    if (t === '-') {
      const v = factor()
      return v === null ? null : -v
    }
    if (t === '+') return factor()
    if (t === '(') {
      const v = expr()
      return next() === ')' ? v : null
    }
    return typeof t === 'number' ? t : null
  }
  const term = (): number | null => {
    let v = factor()
    while (v !== null && (peek() === '*' || peek() === '/')) {
      const op = next()
      const rhs = factor()
      if (rhs === null) return null
      if (op === '/' && rhs === 0) return null
      v = op === '*' ? v * rhs : v / rhs
    }
    return v
  }
  function expr(): number | null {
    let v = term()
    while (v !== null && (peek() === '+' || peek() === '-')) {
      const op = next()
      const rhs = term()
      if (rhs === null) return null
      v = op === '+' ? v + rhs : v - rhs
    }
    return v
  }

  const result = expr()
  if (result === null || pos !== tokens.length || !Number.isFinite(result)) return null
  // Trim float noise: 0.1 + 0.2 → 0.3
  return Number(result.toPrecision(12))
}

type Token = number | '+' | '-' | '*' | '/' | '(' | ')'

function tokenize(input: string, locale: string): Token[] | null {
  const tokens: Token[] = []
  const re = /\s*(?:([\d.,]+)|([-+*/()x×÷]))/gy
  let match: RegExpExecArray | null
  let consumed = 0
  while ((match = re.exec(input)) !== null) {
    consumed = re.lastIndex
    const [, num, op] = match
    if (num !== undefined) {
      const parsed = normalizeDecimalText(num, locale)
      if (!parsed.ok || parsed.value === null) return null
      tokens.push(Number(parsed.value))
    } else if (op !== undefined) {
      tokens.push(op === 'x' || op === '×' ? '*' : op === '÷' ? '/' : (op as Token))
    }
  }
  return input.slice(consumed).trim() === '' && tokens.length > 0 ? tokens : null
}
