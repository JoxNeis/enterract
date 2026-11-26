import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Tabs } from './Tabs'

const items = [
  { key: 'general', label: 'General', content: <input aria-label='Name' /> },
  { key: 'lines', label: 'Lines', content: 'Lines panel', badge: 3 },
  { key: 'tax', label: 'Tax', content: 'Tax panel', invalid: true },
  { key: 'audit', label: 'Audit', content: 'Audit panel', disabled: true },
]

describe('Tabs', () => {
  it('renders tabs and the selected panel', () => {
    render(
      <Tabs
        items={items}
        aria-label='Order'
        className='extra'
      />
    )

    expect(screen.getByRole('tablist', { name: 'Order' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'General' })).toBeVisible()
    expect(screen.getByRole('tab', { name: /tax \(has errors\)/i })).toHaveAttribute('data-invalid', 'true')
    expect(screen.getByRole('tablist').parentElement).toHaveClass('erp-tabs', 'extra')
  })

  it('switches with arrows and skips disabled tabs', async () => {
    const onChange = vi.fn()
    render(
      <Tabs
        items={items}
        onChange={onChange}
      />
    )

    await userEvent.click(screen.getByRole('tab', { name: 'General' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith('lines', undefined)
    expect(screen.getByRole('tab', { name: /lines/i })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'General' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(onChange).toHaveBeenLastCalledWith('tax', undefined)
  })

  it('keeps hidden panels mounted so form state survives', async () => {
    render(<Tabs items={items} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Acme')
    await userEvent.click(screen.getByRole('tab', { name: /lines/i }))
    await userEvent.click(screen.getByRole('tab', { name: 'General' }))
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Acme')
  })

  it('manual activation needs Enter', async () => {
    const onChange = vi.fn()
    render(
      <Tabs
        items={items}
        activation='manual'
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('tab', { name: 'General' }))
    onChange.mockClear()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('lines', undefined)
  })
})
