import type { ReactNode } from 'react'

export interface WorkflowStage {
  key: string
  label: string
  description?: ReactNode
}

/** Draft → Submitted → Approved → Posted. */
export const documentStages: WorkflowStage[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'posted', label: 'Posted' },
]
