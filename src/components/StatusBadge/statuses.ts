export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'progress'

export interface StatusDefinition {
  label: string
  tone: StatusTone
}

/** Standard document and payment statuses. Extend or override with StatusBadge's `statusMap`. */
export const documentStatuses: Record<string, StatusDefinition> = {
  draft: { label: 'Draft', tone: 'neutral' },
  submitted: { label: 'Submitted', tone: 'info' },
  'pending-approval': { label: 'Pending approval', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  posted: { label: 'Posted', tone: 'success' },
  released: { label: 'Released', tone: 'progress' },
  'in-progress': { label: 'In progress', tone: 'progress' },
  'on-hold': { label: 'On hold', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'neutral' },
  open: { label: 'Open', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
  'partially-paid': { label: 'Partially paid', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  blocked: { label: 'Blocked', tone: 'danger' },
}
