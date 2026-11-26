import type { TreeNode } from './treeUtils'

/** A small chart of accounts. */
export const accountTree: TreeNode[] = [
  {
    id: '1',
    label: 'Assets',
    description: '1000',
    children: [
      {
        id: '11',
        label: 'Current assets',
        description: '1100',
        children: [
          { id: '111', label: 'Cash', description: '1110' },
          { id: '112', label: 'Bank accounts', description: '1120' },
          { id: '113', label: 'Accounts receivable', description: '1130' },
        ],
      },
      {
        id: '12',
        label: 'Fixed assets',
        description: '1200',
        children: [
          { id: '121', label: 'Machinery', description: '1210' },
          { id: '122', label: 'Vehicles', description: '1220' },
        ],
      },
    ],
  },
  {
    id: '2',
    label: 'Liabilities',
    description: '2000',
    children: [
      { id: '21', label: 'Accounts payable', description: '2100' },
      { id: '22', label: 'Taxes payable', description: '2200', disabled: true },
    ],
  },
  { id: '3', label: 'Equity', description: '3000', hasChildren: true },
  { id: '4', label: 'Revenue', description: '4000' },
]

/** Lazy children for Equity, with a small fixed delay. */
export function loadAccounts(node: TreeNode): Promise<TreeNode[]> {
  const children: Record<string, TreeNode[]> = {
    '3': [
      { id: '31', label: 'Share capital', description: '3100' },
      { id: '32', label: 'Retained earnings', description: '3200' },
    ],
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(children[node.id] ?? [])
    }, 300)
  })
}
