import type { ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import type { Size } from '../../utils/types'
import { Icon } from '../Icon'
import { documentStages, type WorkflowStage } from './stages'
import '../../styles/base.css'
import './WorkflowStages.css'

export interface WorkflowStagesProps extends ComponentProps<'ol'> {
  stages?: readonly WorkflowStage[]
  /** Key of the current stage. */
  current: string
  /** State of the current stage. `rejected` marks it as failed; `complete` marks every stage done. */
  currentState?: 'active' | 'rejected' | 'complete'
  orientation?: 'horizontal' | 'vertical'
  size?: Size
}

type StepState = 'complete' | 'current' | 'rejected' | 'upcoming'

const stateText: Record<StepState, string> = {
  complete: 'completed',
  current: 'current',
  rejected: 'rejected',
  upcoming: 'not started',
}

/** Where a document is in its workflow: Draft → Submitted → Approved → Posted. */
export function WorkflowStages({
  stages = documentStages,
  current,
  currentState = 'active',
  orientation = 'horizontal',
  size = 'md',
  className,
  ...props
}: WorkflowStagesProps) {
  const currentIndex = stages.findIndex((s) => s.key === current)
  return (
    <ol
      className={cx('erp-workflow-stages', className)}
      data-orientation={orientation}
      data-size={size}
      aria-label='Workflow stages'
      {...props}
    >
      {stages.map((stage, i) => {
        const state: StepState =
          currentState === 'complete' || i < currentIndex
            ? 'complete'
            : i === currentIndex
              ? currentState === 'rejected'
                ? 'rejected'
                : 'current'
              : 'upcoming'
        return (
          <li
            key={stage.key}
            className='erp-workflow-stages__step'
            data-state={state}
            aria-current={i === currentIndex ? 'step' : undefined}
          >
            <span
              className='erp-workflow-stages__marker'
              aria-hidden='true'
            >
              {state === 'complete' ? (
                <Icon name='check' />
              ) : state === 'rejected' ? (
                <Icon name='close' />
              ) : (
                String(i + 1)
              )}
            </span>
            <span className='erp-workflow-stages__text'>
              <span className='erp-workflow-stages__label'>{stage.label}</span>
              <span className='erp-visually-hidden'>, {stateText[state]}</span>
              {stage.description && <span className='erp-workflow-stages__description'>{stage.description}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
