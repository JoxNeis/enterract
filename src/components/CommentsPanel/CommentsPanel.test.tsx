import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CommentsPanel } from './CommentsPanel'
import { comments, currentUser } from './CommentsPanel.fixtures'

describe('CommentsPanel', () => {
  it('lists comments in order with authors, times and the internal flag', () => {
    render(
      <CommentsPanel
        comments={comments}
        className='extra'
      />
    )
    const region = screen.getByRole('region', { name: 'Comments' })
    expect(region).toHaveClass('erp-comments-panel', 'extra')
    const items = within(region).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Markus Weber')
    expect(items[2]).toHaveTextContent('Internal')
    expect(screen.getByText('Mar 14, 2026, 8:30 AM')).toBeInTheDocument()
  })

  it('posts with the button and with Ctrl+Enter', async () => {
    const onAdd = vi.fn()
    render(
      <CommentsPanel
        comments={[]}
        onAdd={onAdd}
        allowInternal
      />
    )
    const box = screen.getByRole('textbox', { name: 'New comment' })
    await userEvent.type(box, 'First note')
    await userEvent.click(screen.getByRole('button', { name: 'Post' }))
    expect(onAdd).toHaveBeenCalledWith('First note', { internal: false })
    await userEvent.type(box, 'Second{Control>}{Enter}{/Control}')
    expect(onAdd).toHaveBeenLastCalledWith('Second', { internal: false })
  })

  it('edits and deletes only own comments', async () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <CommentsPanel
        comments={comments}
        currentUserId={currentUser.id}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    expect(screen.getAllByRole('button', { name: 'Edit comment' })).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: 'Edit comment' }))
    const box = screen.getByRole('textbox', { name: 'Edit comment' })
    await userEvent.clear(box)
    await userEvent.type(box, 'Updated')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onEdit).toHaveBeenCalledWith('c2', 'Updated')
    await userEvent.click(screen.getByRole('button', { name: 'Delete comment' }))
    expect(onDelete).toHaveBeenCalledWith('c2')
  })

  it('has no composer when read-only', () => {
    render(
      <CommentsPanel
        comments={comments}
        onAdd={vi.fn()}
        readOnly
      />
    )
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})
