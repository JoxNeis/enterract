import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DocumentPreview, type PreviewFile } from './DocumentPreview'

const scan: PreviewFile = { name: 'INV-0318.png', url: 'https://files.example/inv.png' }
const pdf: PreviewFile = { name: 'PO-7781.pdf', url: 'https://files.example/po.pdf' }
const sheet: PreviewFile = { name: 'prices.xlsx', url: 'https://files.example/prices.xlsx' }

describe('DocumentPreview', () => {
  it('shows an image with zoom and rotate controls', async () => {
    const user = userEvent.setup()
    render(<DocumentPreview files={[scan]} />)
    expect(screen.getByRole('region', { name: 'Preview of INV-0318.png' })).toBeInTheDocument()
    const img = screen.getByRole('img', { name: 'INV-0318.png' })
    expect(img).toHaveStyle({ transform: 'scale(1) rotate(0deg)' })
    expect(screen.getByText('100%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(screen.getByText('125%')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Rotate 90°' }))
    expect(img).toHaveStyle({ transform: 'scale(1.25) rotate(90deg)' })

    const out = screen.getByRole('button', { name: 'Zoom out' })
    await user.click(out)
    await user.click(out)
    await user.click(out)
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(out).toBeDisabled()
    // No paging for a single file.
    expect(screen.queryByRole('button', { name: 'Next file' })).not.toBeInTheDocument()
  })

  it('renders PDFs in a frame and offers download and open links', () => {
    render(<DocumentPreview files={[pdf]} />)
    expect(screen.getByTitle('PO-7781.pdf')).toHaveAttribute('src', pdf.url)
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Download PO-7781.pdf' })).toHaveAttribute('download', 'PO-7781.pdf')
    expect(screen.getByRole('link', { name: 'Open PO-7781.pdf in a new tab' })).toHaveAttribute('target', '_blank')
  })

  it('falls back to a download link for unsupported types', () => {
    render(<DocumentPreview files={[sheet]} />)
    expect(screen.getByText('No preview for this file type.')).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: 'Download prices.xlsx' })
    expect(links).toHaveLength(2)
    for (const link of links) expect(link).toHaveAttribute('href', sheet.url)
  })

  it('pages through several files and resets zoom', async () => {
    const user = userEvent.setup()
    const onIndexChange = vi.fn()
    render(
      <DocumentPreview
        files={[scan, pdf, sheet]}
        onIndexChange={onIndexChange}
      />
    )
    const prev = screen.getByRole('button', { name: 'Previous file' })
    const next = screen.getByRole('button', { name: 'Next file' })
    expect(prev).toBeDisabled()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    await user.click(next)
    expect(onIndexChange).toHaveBeenCalledWith(1)
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Preview of PO-7781.pdf' })).toBeInTheDocument()

    await user.click(next)
    expect(next).toBeDisabled()
    await user.click(prev)
    await user.click(prev)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('honours a controlled index and an empty file list', () => {
    const { rerender } = render(
      <DocumentPreview
        files={[scan, pdf]}
        index={1}
      />
    )
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    rerender(<DocumentPreview files={[]} />)
    expect(screen.getByRole('region', { name: 'Document preview' })).toBeInTheDocument()
    expect(screen.getByText('Nothing to preview')).toBeInTheDocument()
  })
})
