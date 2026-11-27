import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { formatDateTime } from '../../utils/format'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { Button } from '../Button'
import { FormField, useFieldProps } from '../FormField'
import { useLocale } from '../LocaleProvider'
import { TextField } from '../TextField'
import '../../styles/base.css'
import './SignatureField.css'

export interface SignatureValue {
  mode: 'draw' | 'type'
  /** Typed name (type mode) or the signer's name if known. */
  name?: string
  /** PNG of the signature. Empty when canvas is unavailable (typed mode keeps `name`). */
  dataUrl: string
  /** ISO 8601 instant. */
  signedAt: string
}

export interface SignatureFieldProps extends FieldProps, NativeDivProps {
  value?: SignatureValue | null
  defaultValue?: SignatureValue | null
  onChange?: (value: SignatureValue | null) => void
  /** Start mode. Typing is the keyboard-accessible alternative to drawing. */
  defaultMode?: 'draw' | 'type'
  /** Clock for `signedAt` (pass a fixed function in stories and tests). */
  now?: () => string
  /** Statement shown above the pad, e.g. "I confirm the goods were received". */
  statement?: string
}

const WIDTH = 480
const HEIGHT = 140

/**
 * Electronic signature: draw with mouse, pen or touch, or type a name. Stores a PNG and the time
 * of signing. Check your compliance requirements (e.g. eIDAS, ESIGN) before relying on it.
 */
export function SignatureField(props: SignatureFieldProps) {
  const [field, rest] = useFieldProps(props)
  const { value, defaultValue = null, onChange, defaultMode = 'draw', now = () => new Date().toISOString(), statement, ...native } = rest
  const { locale, timeZone } = useLocale()
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange: onChange ? (v) => { onChange(v) } : undefined })
  const [mode, setMode] = useState<'draw' | 'type'>(current?.mode ?? defaultMode)
  const [typed, setTyped] = useState<string | null>(current?.mode === 'type' ? (current.name ?? null) : null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const dirty = useRef(false)
  const editable = !field.disabled && !field.readOnly

  const ctx = () => {
    const c = canvasRef.current?.getContext('2d')
    if (!c) return null
    c.lineWidth = 2.5
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.strokeStyle = '#1f2933'
    return c
  }

  // Draw the stored image (or typed name) when the value changes from outside.
  useEffect(() => {
    const c = ctx()
    const canvas = canvasRef.current
    if (!c || !canvas) return
    c.clearRect(0, 0, canvas.width, canvas.height)
    if (current?.dataUrl) {
      const img = new Image()
      img.onload = () => {
        c.drawImage(img, 0, 0)
      }
      img.src = current.dataUrl
    }
  }, [current?.dataUrl])

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return [((event.clientX - rect.left) / (rect.width || WIDTH)) * WIDTH, ((event.clientY - rect.top) / (rect.height || HEIGHT)) * HEIGHT] as const
  }

  const finishDrawing = () => {
    if (!drawing.current) return
    drawing.current = false
    if (dirty.current) setCurrent({ mode: 'draw', dataUrl: canvasRef.current?.toDataURL('image/png') ?? '', signedAt: now() })
  }

  const commitTyped = (name: string | null) => {
    setTyped(name)
    if (!name?.trim()) {
      setCurrent(null)
      return
    }
    let dataUrl = ''
    const c = ctx()
    const canvas = canvasRef.current
    if (c && canvas) {
      c.clearRect(0, 0, canvas.width, canvas.height)
      c.font = 'italic 40px "Segoe Script", "Brush Script MT", cursive'
      c.fillStyle = '#1f2933'
      c.textBaseline = 'middle'
      c.fillText(name, 16, HEIGHT / 2, WIDTH - 32)
      dataUrl = canvas.toDataURL('image/png')
    }
    setCurrent({ mode: 'type', name: name.trim(), dataUrl, signedAt: now() })
  }

  const clear = () => {
    const c = ctx()
    const canvas = canvasRef.current
    if (c && canvas) c.clearRect(0, 0, canvas.width, canvas.height)
    dirty.current = false
    setTyped(null)
    setCurrent(null)
  }

  return (
    <FormField
      {...field}
      group
      className={cx('erp-signature', field.className)}
      helpText={field.helpText ?? (current ? `Signed ${formatDateTime(current.signedAt, locale, timeZone)}` : undefined)}
    >
      {(f) => (
        <div
          role='group'
          id={f.id}
          aria-labelledby={field.label != null ? f.labelId : undefined}
          aria-describedby={f.describedBy}
          className='erp-signature__body'
          data-invalid={flag(f.invalid)}
          {...native}
        >
          {statement && <p className='erp-signature__statement'>{statement}</p>}
          {editable && (
            <div
              className='erp-signature__modes'
              role='radiogroup'
              aria-label='Signature method'
            >
              {(['draw', 'type'] as const).map((m) => (
                <button
                  key={m}
                  type='button'
                  role='radio'
                  aria-checked={mode === m}
                  onClick={() => {
                    setMode(m)
                    clear()
                  }}
                >
                  {m === 'draw' ? 'Draw' : 'Type name'}
                </button>
              ))}
            </div>
          )}
          {mode === 'type' && editable && (
            <TextField
              label='Full name'
              size='sm'
              value={typed}
              onChange={commitTyped}
              autoComplete='name'
            />
          )}
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className='erp-signature__pad'
            role='img'
            aria-label={current ? `Signature${current.name ? ` of ${current.name}` : ''}` : mode === 'draw' ? 'Signature pad, draw with mouse, pen or finger' : 'Signature preview'}
            data-mode={mode}
            data-empty={flag(!current)}
            onPointerDown={(event) => {
              if (!editable || mode !== 'draw') return
              const c = ctx()
              if (!c) return
              try {
                event.currentTarget.setPointerCapture(event.pointerId)
              } catch {
                // Synthetic pointers (scripts, tests) cannot be captured; drawing still works.
              }
              drawing.current = true
              dirty.current = true
              const [x, y] = point(event)
              c.beginPath()
              c.moveTo(x, y)
            }}
            onPointerMove={(event) => {
              if (!drawing.current) return
              const c = ctx()
              if (!c) return
              const [x, y] = point(event)
              c.lineTo(x, y)
              c.stroke()
            }}
            onPointerUp={finishDrawing}
            onPointerLeave={finishDrawing}
          />
          {mode === 'type' && current?.name && !current.dataUrl && <p className='erp-signature__typed'>{current.name}</p>}
          {editable && (
            <div className='erp-signature__actions'>
              <span className='erp-signature__line'>Sign above the line</span>
              <Button
                size='sm'
                variant='ghost'
                onClick={clear}
                disabled={!current}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      )}
    </FormField>
  )
}
