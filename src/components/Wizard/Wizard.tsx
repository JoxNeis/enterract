import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { useControllableState } from '../../utils/useControllableState'
import { Alert } from '../Alert'
import { Button } from '../Button'
import { Icon } from '../Icon'
import '../../styles/base.css'
import './Wizard.css'

/** Result of a step check: `true`/undefined passes; a string or list of strings blocks with messages. */
export type StepValidation = boolean | string | string[] | undefined

export interface WizardStep {
  key: string
  title: string
  description?: ReactNode
  content: ReactNode
  /** Runs on Next. Return messages (or false) to stay on the step. May be async. */
  validate?: () => StepValidation | Promise<StepValidation>
  /** Shown as optional in the step list. */
  optional?: boolean
}

export interface WizardProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  steps: readonly WizardStep[]
  /** Index of the current step. */
  current?: number
  defaultCurrent?: number
  onStepChange?: (index: number) => void
  /** Runs after the last step validates. May be async; the button shows a spinner. */
  onFinish: () => void | Promise<void>
  onCancel?: () => void
  finishLabel?: string
  /** Let users jump back to completed steps from the step list. */
  allowStepNavigation?: boolean
}

function messagesOf(result: StepValidation): string[] {
  if (result === undefined || result === true) return []
  if (result === false) return ['Please complete this step']
  return Array.isArray(result) ? result : [result]
}

/**
 * Multi-step task (import wizard, onboarding, period close). Each step is validated before
 * moving on; focus moves to the new step's heading.
 */
export function Wizard({
  steps,
  current,
  defaultCurrent = 0,
  onStepChange,
  onFinish,
  onCancel,
  finishLabel = 'Finish',
  allowStepNavigation = true,
  className,
  ...props
}: WizardProps) {
  const [index, setIndex] = useControllableState({ value: current, defaultValue: defaultCurrent, onChange: onStepChange })
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [visited, setVisited] = useState(index)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)
  const id = useId()
  const step = steps[index]
  const last = index === steps.length - 1

  useEffect(() => {
    if (moved.current) headingRef.current?.focus()
  }, [index])

  const go = (next: number) => {
    moved.current = true
    setErrors([])
    setIndex(next)
    setVisited((v) => Math.max(v, next))
  }

  const next = async () => {
    if (!step) return
    setBusy(true)
    try {
      const messages = messagesOf(await step.validate?.())
      if (messages.length) {
        setErrors(messages)
        return
      }
      if (last) await onFinish()
      else go(index + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={cx('erp-wizard', className)}
      {...props}
    >
      <ol
        className='erp-wizard__steps'
        aria-label='Steps'
      >
        {steps.map((s, i) => {
          const state = i < index ? 'complete' : i === index ? 'current' : 'upcoming'
          const canJump = allowStepNavigation && i <= visited && i !== index && !busy
          return (
            <li
              key={s.key}
              className='erp-wizard__step'
              data-state={state}
              aria-current={i === index ? 'step' : undefined}
            >
              <button
                type='button'
                className='erp-wizard__step-button'
                disabled={!canJump}
                onClick={() => {
                  go(i)
                }}
              >
                <span
                  className='erp-wizard__marker'
                  aria-hidden='true'
                >
                  {state === 'complete' ? <Icon name='check' /> : String(i + 1)}
                </span>
                <span className='erp-wizard__step-title'>
                  {s.title}
                  {s.optional && <span className='erp-wizard__optional'>Optional</span>}
                </span>
                <span className='erp-visually-hidden'>
                  , step {i + 1} of {steps.length}
                  {state === 'complete' ? ', completed' : ''}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      {step && (
        <section
          className='erp-wizard__content'
          aria-labelledby={`${id}-title`}
        >
          <h2
            id={`${id}-title`}
            ref={headingRef}
            tabIndex={-1}
            className='erp-wizard__title'
          >
            {step.title}
          </h2>
          {step.description && <p className='erp-wizard__description'>{step.description}</p>}
          {errors.length > 0 && (
            <Alert
              tone='error'
              title='Please fix the following'
            >
              <ul className='erp-wizard__errors'>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Alert>
          )}
          <div
            className='erp-wizard__body'
            data-invalid={flag(errors.length)}
          >
            {step.content}
          </div>
        </section>
      )}
      <footer className='erp-wizard__footer'>
        {onCancel && (
          <Button
            variant='ghost'
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>
        )}
        <span className='erp-wizard__spacer' />
        <Button
          onClick={() => {
            go(index - 1)
          }}
          disabled={index === 0 || busy}
          icon={<Icon name='chevron-left' />}
        >
          Back
        </Button>
        <Button
          variant='primary'
          loading={busy}
          iconEnd={last ? undefined : <Icon name='chevron-right' />}
          onClick={() => {
            void next()
          }}
        >
          {last ? finishLabel : 'Next'}
        </Button>
      </footer>
    </div>
  )
}
