import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DownloadLink } from '../DownloadLink'
import { DrillLink } from '../DrillLink'
import { Link } from './Link'

describe('Link', () => {
  it('renders an anchor and marks external links', () => {
    render(
      <>
        <Link
          href='/orders/1'
          className='extra'
        >
          SO-1
        </Link>
        <Link
          href='https://example.com'
          external
        >
          Docs
        </Link>
      </>
    )
    expect(screen.getByRole('link', { name: 'SO-1' })).toHaveClass('erp-link', 'extra')
    const ext = screen.getByRole('link', { name: /docs \(opens in a new tab\)/i })
    expect(ext).toHaveAttribute('target', '_blank')
    expect(ext).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does nothing when disabled', () => {
    const onClick = vi.fn()
    render(
      <Link
        href='/x'
        disabled
        onClick={onClick}
      >
        X
      </Link>
    )
    const link = screen.getByText('X').closest('a')
    expect(link).not.toHaveAttribute('href')
    expect(link).toHaveAttribute('aria-disabled', 'true')
  })
})

describe('DownloadLink', () => {
  it('links to a file with its size', () => {
    render(
      <DownloadLink
        href='/files/a.pdf'
        fileName='a.pdf'
        size={2048}
      />
    )
    const link = screen.getByRole('link', { name: /a\.pdf/ })
    expect(link).toHaveAttribute('download', 'a.pdf')
    expect(link).toHaveTextContent('(2 KB)')
  })

  it('generates the file on click', async () => {
    const getFile = vi.fn(() => Promise.resolve(new Blob(['x'])))
    render(
      <DownloadLink
        fileName='report.csv'
        getFile={getFile}
      />
    )
    await userEvent.click(screen.getByRole('link'))
    expect(getFile).toHaveBeenCalled()
  })
})

describe('DrillLink', () => {
  it('opens details and names the target', async () => {
    const onDrill = vi.fn()
    render(
      <DrillLink
        target='Overdue invoices'
        onDrill={onDrill}
      >
        $12,400
      </DrillLink>
    )
    await userEvent.click(screen.getByRole('button', { name: '$12,400, view details for Overdue invoices' }))
    expect(onDrill).toHaveBeenCalled()
  })
})
