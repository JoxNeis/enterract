import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Wizard, type WizardStep } from './Wizard'

function steps(valid: { current: boolean }): WizardStep[] {
  return [
    { key: 'file', title: 'Upload file', content: 'Choose a file', validate: () => (valid.current ? true : 'Choose a file first') },
    { key: 'map', title: 'Map columns', content: 'Mapping', optional: true },
    { key: 'review', title: 'Review', content: 'Review import' },
  ]
}

describe('Wizard', () => {
  it('validates before moving on and focuses the step heading', async () => {
    const valid = { current: false }
    const onStepChange = vi.fn()
    render(
      <Wizard
        steps={steps(valid)}
        onFinish={vi.fn()}
        onStepChange={onStepChange}
        className='extra'
      />
    )
    expect(screen.getByRole('heading', { name: 'Upload file' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a file first')
    expect(onStepChange).not.toHaveBeenCalled()
    valid.current = true
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onStepChange).toHaveBeenCalledWith(1, undefined)
    expect(screen.getByRole('heading', { name: 'Map columns' })).toHaveFocus()
    expect(screen.getByRole('list', { name: 'Steps' }).parentElement).toHaveClass('erp-wizard', 'extra')
  })

  it('goes back, jumps to visited steps and finishes', async () => {
    const onFinish = vi.fn()
    render(
      <Wizard
        steps={steps({ current: true })}
        onFinish={onFinish}
        finishLabel='Import'
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /upload file.*step 1 of 3.*completed/i }))
    expect(screen.getByRole('heading', { name: 'Upload file' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /review.*step 3 of 3/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Import' }))
    expect(onFinish).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Map columns' })).toBeInTheDocument()
  })
})
