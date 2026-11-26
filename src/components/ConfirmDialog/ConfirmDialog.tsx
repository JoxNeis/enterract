import { useState, type ReactNode } from 'react'
import { Button } from '../Button'
import { Dialog } from '../Dialog'
import { TextArea } from '../TextArea'

export interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` for destructive actions (Delete, Reject, Cancel document). */
  tone?: 'default' | 'danger'
  /** Ask for a reason before confirming (Reject). */
  requireReason?: boolean
  reasonLabel?: string
  /** Receives the reason when `requireReason` is set. May return a promise; the button shows a spinner. */
  onConfirm: (reason?: string) => void | Promise<void>
  onCancel: () => void
}

/** Confirmation for actions that need one: approve, post, delete, reject with reason. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  requireReason = false,
  reasonLabel = 'Reason',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)
  const missing = requireReason && !reason?.trim()

  const close = () => {
    setReason(null)
    setTouched(false)
    onCancel()
  }

  const confirm = async () => {
    if (missing) {
      setTouched(true)
      return
    }
    setBusy(true)
    try {
      await onConfirm(requireReason ? (reason ?? '').trim() : undefined)
      setReason(null)
      setTouched(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      description={message}
      role='alertdialog'
      size='sm'
      footer={
        <>
          <Button
            variant='ghost'
            onClick={close}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={busy}
            onClick={() => {
              void confirm()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {requireReason ? (
        <TextArea
          label={reasonLabel}
          required
          rows={3}
          value={reason}
          onChange={setReason}
          error={touched && missing ? 'Enter a reason' : undefined}
          autoFocus
        />
      ) : null}
    </Dialog>
  )
}
