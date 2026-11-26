import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AttachmentList } from './AttachmentList'
import { attachments } from './AttachmentList.fixtures'

describe('AttachmentList', () => {
  it('lists files with size and uploader', () => {
    render(
      <AttachmentList
        attachments={attachments}
        className='extra'
      />
    )
    const region = screen.getByRole('region', { name: 'Attachments' })
    expect(region).toHaveClass('erp-attachment-list', 'extra')
    expect(within(region).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText(/178 KB · Dewi Lestari/)).toBeInTheDocument()
  })

  it('downloads and deletes after confirmation', async () => {
    const onDownload = vi.fn()
    const onDelete = vi.fn()
    render(
      <AttachmentList
        attachments={attachments}
        onDownload={onDownload}
        onDelete={onDelete}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Download PO-2026-0142.pdf' }))
    expect(onDownload).toHaveBeenCalledWith(attachments[0])
    await userEvent.click(screen.getByRole('button', { name: 'Delete PO-2026-0142.pdf' }))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith(attachments[0])
  })

  it('hides upload and delete when read-only', () => {
    render(
      <AttachmentList
        attachments={attachments}
        readOnly
        onDelete={vi.fn()}
        onFilesSelected={vi.fn()}
      />
    )
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Browse files' })).toBeNull()
  })

  it('shows an empty state with an upload area', () => {
    render(
      <AttachmentList
        attachments={[]}
        onFilesSelected={vi.fn()}
      />
    )
    expect(screen.getByText('No files attached')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Browse files' })).toBeInTheDocument()
  })
})
