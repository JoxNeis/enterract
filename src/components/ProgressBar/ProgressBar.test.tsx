import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('exposes value and text', () => {
    render(
      <ProgressBar
        label='Importing'
        value={30}
        max={120}
        className='extra'
      />
    )
    const bar = screen.getByRole('progressbar', { name: 'Importing' })
    expect(bar).toHaveAttribute('aria-valuenow', '30')
    expect(bar).toHaveAttribute('aria-valuemax', '120')
    expect(bar).toHaveAttribute('aria-valuetext', '25 %')
    expect(screen.getByText('25 %')).toBeInTheDocument()
    expect(bar.parentElement).toHaveClass('erp-progress', 'extra')
  })

  it('supports custom value text and indeterminate', () => {
    const { rerender } = render(
      <ProgressBar
        label='Upload'
        value={3}
        max={12}
        valueText='3 of 12 files'
      />
    )
    expect(screen.getByText('3 of 12 files')).toBeInTheDocument()
    rerender(<ProgressBar label='Posting' />)
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow')
  })
})
