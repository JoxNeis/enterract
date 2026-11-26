import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '../LocaleProvider'
import { ValueDisplay } from './ValueDisplay'

describe('ValueDisplay', () => {
  it('formats by type and is labelled', () => {
    render(
      <>
        <ValueDisplay
          label='Total'
          type='currency'
          value='1234.5'
          className='extra'
        />
        <ValueDisplay
          label='Discount'
          type='percent'
          value={0.125}
        />
        <ValueDisplay
          label='Due'
          type='date'
          value='2026-03-15'
        />
        <ValueDisplay
          label='Taxable'
          type='boolean'
          value
        />
      </>
    )
    expect(screen.getByRole('group', { name: 'Total' })).toHaveTextContent('$1,234.50')
    expect(screen.getByRole('group', { name: 'Total' })).toHaveClass('erp-value-display', 'extra')
    expect(screen.getByRole('group', { name: 'Discount' })).toHaveTextContent('12.5 %')
    expect(screen.getByRole('group', { name: 'Due' })).toHaveTextContent('Mar 15, 2026')
    expect(screen.getByRole('group', { name: 'Taxable' })).toHaveTextContent('Yes')
  })

  it('shows an empty marker and a calculated marker', () => {
    render(
      <>
        <ValueDisplay
          label='Reference'
          value={null}
        />
        <ValueDisplay
          label='Line total'
          type='number'
          value={12}
          calculated='Qty × Price'
        />
      </>
    )
    expect(screen.getByRole('group', { name: 'Reference' })).toHaveTextContent('—')
    expect(screen.getByRole('img', { name: 'Calculated: Qty × Price' })).toBeInTheDocument()
  })

  it('uses the provider locale', () => {
    render(
      <LocaleProvider
        locale='de-DE'
        currency='EUR'
      >
        <ValueDisplay
          label='Betrag'
          type='currency'
          value='1234.5'
        />
      </LocaleProvider>
    )
    expect(screen.getByRole('group', { name: 'Betrag' })).toHaveTextContent('1.234,50')
  })
})
