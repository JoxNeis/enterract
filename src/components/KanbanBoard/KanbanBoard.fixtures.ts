import type { KanbanCard, KanbanColumn } from './KanbanBoard'

export const columns: KanbanColumn[] = [
  { key: 'new', title: 'New' },
  { key: 'picking', title: 'Picking', limit: 3 },
  { key: 'packing', title: 'Packing', limit: 2 },
  { key: 'shipped', title: 'Shipped' },
]

export const cards: KanbanCard[] = [
  { id: 'SO-1041', column: 'new', title: 'SO-1041 · Acme Trading', description: '12 lines', tags: ['Export'], dueDate: '2026-03-18', assignee: 'Budi Santoso' },
  { id: 'SO-1042', column: 'new', title: 'SO-1042 · Delta Foods', description: '3 lines', priority: 'high', dueDate: '2026-03-14' },
  { id: 'SO-1043', column: 'picking', title: 'SO-1043 · Harbor Marine', description: '5 lines', assignee: 'Rina Wijaya', dueDate: '2026-03-16' },
  { id: 'SO-1044', column: 'picking', title: 'SO-1044 · Global Steel', tags: ['Rush'], priority: 'high' },
  { id: 'SO-1045', column: 'packing', title: 'SO-1045 · Lumen Optics', assignee: 'Agus Pratama' },
  { id: 'SO-1046', column: 'packing', title: 'SO-1046 · Jaya Pharma', tags: ['Cold chain'] },
  { id: 'SO-1047', column: 'packing', title: 'SO-1047 · Kencana Retail' },
  { id: 'SO-1040', column: 'shipped', title: 'SO-1040 · Fajar Motor' },
]
