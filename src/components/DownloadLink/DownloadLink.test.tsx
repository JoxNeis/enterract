import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DownloadLink } from './DownloadLink'

describe('DownloadLink', () => {
  it('reports failures of getFile', async () => {
    const onError = vi.fn()
    render(
      <DownloadLink
        fileName='report.xlsx'
        getFile={() => Promise.reject(new Error('Server error'))}
        onError={onError}
        className='extra'
      >
        Download report
      </DownloadLink>
    )
    const link = screen.getByRole('link', { name: 'Download report' })
    expect(link).toHaveClass('erp-download-link', 'extra')
    await userEvent.click(link)
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})
