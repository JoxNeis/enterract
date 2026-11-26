import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { cx } from '../../utils/cx'
import { useStableCallback } from '../../utils/hooks'
import type { Size } from '../../utils/types'
import { Button } from '../Button'
import { ConfirmDialog } from '../ConfirmDialog'
import { Icon } from '../Icon'
import { MenuButton } from '../MenuButton'
import {
  isActionVisible,
  matchesShortcut,
  resolveAction,
  type ActionContext,
  type ActionDefinition,
  type ConfirmOptions,
  type StandardActionId,
} from './actions'
import './ActionBar.css'

export interface ActionPayload {
  /** Reason entered in the confirmation (Reject). */
  reason?: string
}

export interface ActionBarProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  /** Standard action ids (`'save'`, `'approve'`…) and/or custom definitions, in display order. */
  actions: readonly (StandardActionId | ActionDefinition)[]
  /** Document state used for visibility and confirmations. */
  context?: ActionContext
  /** Runs after any confirmation. May return a promise; the button shows a spinner meanwhile. */
  onAction: (id: string, payload: ActionPayload) => void | Promise<void>
  /** Keyboard shortcuts. `global` listens on the window, `container` only inside the bar's parent. */
  shortcuts?: 'global' | 'container' | 'off'
  /** Show at most this many buttons; the rest go to a More menu. */
  maxVisible?: number
  size?: Size
  'aria-label'?: string
}

const defaultConfirm = (action: ActionDefinition): ConfirmOptions => ({
  title: `${action.label}?`,
  confirmLabel: action.label,
})

/**
 * Toolbar for document actions (Save, Submit, Approve, Post…). Shows only the actions allowed
 * for the document status and permissions, runs shortcuts and asks for confirmation where needed.
 */
export function ActionBar({
  actions,
  context = {},
  onAction,
  shortcuts = 'global',
  maxVisible,
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Document actions',
  ...props
}: ActionBarProps) {
  const [pending, setPending] = useState<{ action: ActionDefinition; options: ConfirmOptions } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const visible = actions.map(resolveAction).filter((a) => isActionVisible(a, context))
  const inline = visible.filter((a) => !a.overflow).slice(0, maxVisible ?? Number.POSITIVE_INFINITY)
  const overflow = visible.filter((a) => !inline.includes(a))

  const run = async (action: ActionDefinition, payload: ActionPayload = {}) => {
    setBusy(action.id)
    try {
      await onAction(action.id, payload)
    } finally {
      setBusy(null)
    }
  }

  const trigger = useStableCallback((action: ActionDefinition) => {
    if (busy || (action.isEnabled && !action.isEnabled(context))) return
    const { confirm } = action
    if (confirm === 'always' || (confirm === 'if-dirty' && context.isDirty)) {
      setPending({
        action,
        options:
          confirm === 'if-dirty'
            ? { title: 'Discard unsaved changes?', confirmLabel: 'Discard', danger: true }
            : defaultConfirm(action),
      })
    } else if (typeof confirm === 'object') {
      setPending({ action, options: confirm })
    } else {
      void run(action)
    }
  })

  const onShortcut = useStableCallback((event: globalThis.KeyboardEvent) => {
    if (event.defaultPrevented || pending) return
    const match = visible.find((a) => a.shortcut && matchesShortcut(event, a.shortcut))
    if (!match) return
    event.preventDefault()
    trigger(match)
  })

  useEffect(() => {
    if (shortcuts === 'off') return
    const target: HTMLElement | Window | null | undefined = shortcuts === 'global' ? window : barRef.current?.parentElement
    if (!target) return
    const listener = (event: Event) => {
      onShortcut(event as globalThis.KeyboardEvent)
    }
    target.addEventListener('keydown', listener)
    return () => {
      target.removeEventListener('keydown', listener)
    }
  }, [shortcuts, onShortcut])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const buttons = Array.from(barRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (index < 0) return
    event.preventDefault()
    buttons[(index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length]?.focus()
  }

  return (
    <div
      ref={barRef}
      role='toolbar'
      aria-label={ariaLabel}
      className={cx('erp-action-bar', className)}
      data-size={size}
      onKeyDown={onKeyDown}
      {...props}
    >
      {inline.map((action) => (
        <Button
          key={action.id}
          variant={action.variant ?? 'secondary'}
          size={size}
          icon={action.icon ? <Icon name={action.icon} /> : undefined}
          loading={busy === action.id}
          disabled={action.isEnabled ? !action.isEnabled(context) : false}
          aria-keyshortcuts={action.shortcut?.replace(/Esc$/, 'Escape')}
          title={action.shortcut ? `${action.label} (${action.shortcut})` : undefined}
          onClick={() => {
            trigger(action)
          }}
        >
          {action.label}
        </Button>
      ))}
      {overflow.length > 0 && (
        <MenuButton
          size={size}
          variant='ghost'
          aria-label='More actions'
          icon={<Icon name='more' />}
          hideChevron
          placement='bottom-end'
          items={overflow.map((a) => ({
            key: a.id,
            label: a.label,
            icon: a.icon ? <Icon name={a.icon} /> : undefined,
            shortcut: a.shortcut,
            danger: a.variant === 'danger',
            disabled: a.isEnabled ? !a.isEnabled(context) : false,
          }))}
          onSelect={(id) => {
            const action = overflow.find((a) => a.id === id)
            if (action) trigger(action)
          }}
        />
      )}
      <ConfirmDialog
        open={pending !== null}
        title={pending?.options.title ?? ''}
        message={pending?.options.message}
        confirmLabel={pending?.options.confirmLabel}
        tone={pending?.options.danger ? 'danger' : 'default'}
        requireReason={pending?.options.requireReason}
        onCancel={() => {
          setPending(null)
        }}
        onConfirm={async (reason) => {
          if (!pending) return
          const { action } = pending
          setPending(null)
          await run(action, reason !== undefined ? { reason } : {})
        }}
      />
    </div>
  )
}
