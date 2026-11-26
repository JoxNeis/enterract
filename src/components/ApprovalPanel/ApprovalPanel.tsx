import { useState, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { formatDateTime, initials } from '../../utils/format'
import { Button } from '../Button'
import { ConfirmDialog } from '../ConfirmDialog'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { StatusBadge } from '../StatusBadge'
import { WorkflowStages, type WorkflowStage } from '../WorkflowStages'
import './ApprovalPanel.css'

export type ApprovalDecision = 'pending' | 'approved' | 'rejected' | 'skipped'

export interface ApprovalStep {
  id: string
  approver: { id: string; name: string; role?: string }
  decision: ApprovalDecision
  /** ISO 8601 instant of the decision. */
  decidedAt?: string
  comment?: string
}

export interface ApprovalPanelProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** Document status (shown as a badge and used for the stage indicator). */
  status: string
  stages?: readonly WorkflowStage[]
  /** Stage key to highlight. Defaults to `status`. */
  currentStage?: string
  steps: readonly ApprovalStep[]
  /** The current user is the pending approver: shows Approve and Reject. */
  canDecide?: boolean
  /** Approve, with an optional comment. */
  onApprove?: (comment?: string) => void | Promise<void>
  /** Reject; a reason is required. */
  onReject?: (reason: string) => void | Promise<void>
  /** Ask for a comment when approving (optional comment otherwise). */
  requireApprovalComment?: boolean
  title?: ReactNode
}

const decisionTone = { pending: 'warning', approved: 'success', rejected: 'danger', skipped: 'neutral' } as const
const decisionLabel = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', skipped: 'Skipped' }

/** Approval workflow for a document: stages, approvers with their decisions, and approve/reject. */
export function ApprovalPanel({
  status,
  stages,
  currentStage,
  steps,
  canDecide = false,
  onApprove,
  onReject,
  requireApprovalComment = false,
  title = 'Approval',
  className,
  ...props
}: ApprovalPanelProps) {
  const { locale, timeZone } = useLocale()
  const [dialog, setDialog] = useState<'approve' | 'reject' | null>(null)
  const rejected = status === 'rejected'

  return (
    <section
      className={cx('erp-approval-panel', className)}
      aria-label={typeof title === 'string' ? title : 'Approval'}
      {...props}
    >
      <header className='erp-approval-panel__header'>
        <h3 className='erp-approval-panel__title'>{title}</h3>
        <StatusBadge status={status} />
      </header>
      <WorkflowStages
        stages={stages}
        current={rejected ? (currentStage ?? 'submitted') : (currentStage ?? (status === 'pending-approval' ? 'submitted' : status))}
        currentState={rejected ? 'rejected' : status === 'posted' ? 'complete' : 'active'}
        size='sm'
      />
      <ol
        className='erp-approval-panel__steps'
        aria-label='Approvers'
      >
        {steps.map((step) => (
          <li
            key={step.id}
            className='erp-approval-panel__step'
            data-decision={step.decision}
          >
            <span
              className='erp-approval-panel__avatar'
              aria-hidden='true'
            >
              {initials(step.approver.name)}
            </span>
            <div className='erp-approval-panel__who'>
              <strong>{step.approver.name}</strong>
              {step.approver.role && <span className='erp-approval-panel__role'>{step.approver.role}</span>}
              {step.comment && (
                <blockquote className='erp-approval-panel__comment'>
                  <Icon name='comment' /> {step.comment}
                </blockquote>
              )}
            </div>
            <div className='erp-approval-panel__decision'>
              <StatusBadge
                status={step.decision}
                label={decisionLabel[step.decision]}
                tone={decisionTone[step.decision]}
                size='sm'
              />
              {step.decidedAt && (
                <time dateTime={step.decidedAt}>{formatDateTime(step.decidedAt, locale, timeZone)}</time>
              )}
            </div>
          </li>
        ))}
      </ol>
      {canDecide && (onApprove !== undefined || onReject !== undefined) && (
        <div className='erp-approval-panel__actions'>
          {onReject && (
            <Button
              variant='danger'
              icon={<Icon name='reject' />}
              onClick={() => {
                setDialog('reject')
              }}
            >
              Reject
            </Button>
          )}
          {onApprove && (
            <Button
              variant='primary'
              icon={<Icon name='approve' />}
              onClick={() => {
                setDialog('approve')
              }}
            >
              Approve
            </Button>
          )}
        </div>
      )}
      <ConfirmDialog
        open={dialog === 'approve'}
        title='Approve this document?'
        confirmLabel='Approve'
        requireReason={requireApprovalComment}
        reasonLabel='Comment'
        onCancel={() => {
          setDialog(null)
        }}
        onConfirm={async (comment) => {
          await onApprove?.(comment)
          setDialog(null)
        }}
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        title='Reject this document?'
        message='The submitter is notified with your reason.'
        confirmLabel='Reject'
        tone='danger'
        requireReason
        onCancel={() => {
          setDialog(null)
        }}
        onConfirm={async (reason) => {
          await onReject?.(reason ?? '')
          setDialog(null)
        }}
      />
    </section>
  )
}
