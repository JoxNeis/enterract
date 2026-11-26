import type { ButtonVariant } from '../Button'
import type { IconName } from '../Icon'

/** Document state the standard actions use to decide whether they are shown. */
export interface ActionContext {
  /** Document status, e.g. `draft`, `pending-approval`, `approved`, `posted`. */
  status?: string
  /** Can the document be edited? Defaults to `status === 'draft'` (or true without a status). */
  editable?: boolean
  /** Unsaved changes. Cancel asks for confirmation when true. */
  isDirty?: boolean
  /** The current user may approve or reject. */
  isApprover?: boolean
  /** The bar sits above a list or grid (shows Export / Import). */
  isList?: boolean
  /** Permission keys the user has. When given, actions with a `permission` need it. */
  permissions?: readonly string[]
}

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  /** Destructive: red confirm button. */
  danger?: boolean
  /** Ask for a reason (Reject). It is passed to `onAction`. */
  requireReason?: boolean
}

/** An action definition: label, icon, shortcut, confirmation, permission and visibility. Not a component. */
export interface ActionDefinition {
  id: string
  label: string
  icon?: IconName
  /** e.g. `Ctrl+S`, `Ctrl+Shift+S`, `Alt+N`, `Esc`. */
  shortcut?: string
  variant?: ButtonVariant
  /** `always`, `if-dirty`, or options for the dialog. Omit for no confirmation. */
  confirm?: 'always' | 'if-dirty' | ConfirmOptions
  /** Permission key required (checked against `context.permissions`). */
  permission?: string
  isVisible?: (ctx: ActionContext) => boolean
  isEnabled?: (ctx: ActionContext) => boolean
  /** Always put this action in the overflow menu. */
  overflow?: boolean
}

const isEditable = (ctx: ActionContext) => ctx.editable ?? (ctx.status === undefined || ctx.status === 'draft')

/** The standard ERP actions (see CONTROLS.md, "Standard ERP actions"). */
export const standardActions = {
  new: { id: 'new', label: 'New', icon: 'add', shortcut: 'Alt+N', permission: 'create' },
  save: {
    id: 'save',
    label: 'Save',
    icon: 'save',
    shortcut: 'Ctrl+S',
    variant: 'primary',
    permission: 'edit',
    isVisible: isEditable,
  },
  saveAndClose: {
    id: 'saveAndClose',
    label: 'Save & Close',
    shortcut: 'Ctrl+Shift+S',
    permission: 'edit',
    isVisible: isEditable,
  },
  submit: {
    id: 'submit',
    label: 'Submit',
    icon: 'send',
    permission: 'submit',
    isVisible: (ctx) => ctx.status === undefined || ctx.status === 'draft',
  },
  approve: {
    id: 'approve',
    label: 'Approve',
    icon: 'approve',
    variant: 'primary',
    permission: 'approve',
    confirm: { title: 'Approve this document?', confirmLabel: 'Approve' },
    isVisible: (ctx) => ctx.status === 'pending-approval' && Boolean(ctx.isApprover),
  },
  reject: {
    id: 'reject',
    label: 'Reject',
    icon: 'reject',
    variant: 'danger',
    permission: 'approve',
    confirm: { title: 'Reject this document?', confirmLabel: 'Reject', danger: true, requireReason: true },
    isVisible: (ctx) => ctx.status === 'pending-approval' && Boolean(ctx.isApprover),
  },
  post: {
    id: 'post',
    label: 'Post',
    icon: 'post',
    variant: 'primary',
    permission: 'post',
    confirm: { title: 'Post this document?', message: 'Posted documents can no longer be edited.', confirmLabel: 'Post' },
    isVisible: (ctx) => ctx.status === 'approved',
  },
  release: {
    id: 'release',
    label: 'Release',
    icon: 'play',
    permission: 'release',
    confirm: { title: 'Release this document?', confirmLabel: 'Release' },
    isVisible: (ctx) => ctx.status === 'approved',
  },
  cancel: {
    id: 'cancel',
    label: 'Cancel',
    icon: 'close',
    shortcut: 'Esc',
    variant: 'ghost',
    confirm: 'if-dirty',
  },
  delete: {
    id: 'delete',
    label: 'Delete',
    icon: 'trash',
    variant: 'danger',
    permission: 'delete',
    confirm: { title: 'Delete this document?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true },
    isVisible: (ctx) => ctx.status === undefined || ctx.status === 'draft',
  },
  print: { id: 'print', label: 'Print', icon: 'print', shortcut: 'Ctrl+P' },
  export: { id: 'export', label: 'Export', icon: 'download', isVisible: (ctx) => Boolean(ctx.isList) },
  import: { id: 'import', label: 'Import', icon: 'upload', permission: 'create', isVisible: (ctx) => Boolean(ctx.isList) },
} satisfies Record<string, ActionDefinition>

export type StandardActionId = keyof typeof standardActions

/** Standard action by id, or a custom definition as is. */
export function resolveAction(action: StandardActionId | ActionDefinition): ActionDefinition {
  return typeof action === 'string' ? standardActions[action] : action
}

/** Whether an action is shown for a context (visibility rule and permission). */
export function isActionVisible(action: ActionDefinition, ctx: ActionContext): boolean {
  if (action.permission && ctx.permissions && !ctx.permissions.includes(action.permission)) return false
  return action.isVisible ? action.isVisible(ctx) : true
}

/** Does a keyboard event match a shortcut string like `Ctrl+Shift+S`? (`Ctrl` also matches ⌘ on macOS.) */
export function matchesShortcut(event: KeyboardEvent | { key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean }, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const want = { ctrl: parts.includes('ctrl'), shift: parts.includes('shift'), alt: parts.includes('alt') }
  const pressed = event.key.toLowerCase() === 'escape' ? 'esc' : event.key.toLowerCase()
  return (
    pressed === key &&
    (event.ctrlKey || event.metaKey) === want.ctrl &&
    event.shiftKey === want.shift &&
    event.altKey === want.alt
  )
}
