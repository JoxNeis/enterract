import type { Comment } from './CommentsPanel'

export const currentUser = { id: 'u1', name: 'Dewi Lestari' }

export const comments: Comment[] = [
  {
    id: 'c1',
    author: { id: 'u2', name: 'Markus Weber' },
    createdAt: '2026-03-14T08:30:00Z',
    text: 'Customer asked to split the delivery into two shipments.',
  },
  {
    id: 'c2',
    author: currentUser,
    createdAt: '2026-03-14T09:05:00Z',
    text: 'OK. I moved line 3 to a second delivery on 22 March.',
  },
  {
    id: 'c3',
    author: { id: 'u3', name: 'Siti Rahma' },
    createdAt: '2026-03-15T07:45:00Z',
    text: 'Credit limit is close. Please get approval before posting.',
    internal: true,
  },
]
