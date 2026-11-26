import type { ApprovalStep } from './ApprovalPanel'
import { must } from '../../test/must'

export const pendingSteps: ApprovalStep[] = [
  {
    id: 's1',
    approver: { id: 'u4', name: 'Rudi Hartono', role: 'Purchasing manager' },
    decision: 'approved',
    decidedAt: '2026-03-15T09:10:00Z',
    comment: 'Prices match the framework agreement.',
  },
  {
    id: 's2',
    approver: { id: 'u5', name: 'Anna Schmidt', role: 'Finance controller' },
    decision: 'pending',
  },
]

export const rejectedSteps: ApprovalStep[] = [
  must(pendingSteps[0]),
  {
    id: 's2',
    approver: { id: 'u5', name: 'Anna Schmidt', role: 'Finance controller' },
    decision: 'rejected',
    decidedAt: '2026-03-15T13:20:00Z',
    comment: 'Over the quarterly budget for cost center 410.',
  },
]
