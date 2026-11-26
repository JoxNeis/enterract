import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LocaleProvider, useLocale } from '../LocaleProvider'
import { Spinner } from '../Spinner'
import { Icon } from './Icon'

describe('Icon', () => {
  it('is decorative by default', () => {
    const { container } = render(<Icon name='search' />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveClass('erp-icon')
  })

  it('is an image when labelled', () => {
    render(
      <Icon
        name='warning'
        label='Warning'
        className='extra'
      />
    )
    expect(screen.getByRole('img', { name: 'Warning' })).toHaveClass('erp-icon', 'extra')
  })
})

describe('Spinner', () => {
  it('announces loading', () => {
    render(<Spinner />)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('can be silent', () => {
    const { container } = render(<Spinner label={null} />)
    expect(screen.queryByRole('status')).toBeNull()
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})

function ShowLocale() {
  const { locale, currency } = useLocale()
  return (
    <span>
      {locale} {currency}
    </span>
  )
}

describe('LocaleProvider', () => {
  it('defaults to en-US / USD and nests', () => {
    render(
      <>
        <ShowLocale />
        <LocaleProvider locale='de-DE'>
          <LocaleProvider currency='EUR'>
            <ShowLocale />
          </LocaleProvider>
        </LocaleProvider>
      </>
    )
    expect(screen.getByText('en-US USD')).toBeInTheDocument()
    expect(screen.getByText('de-DE EUR')).toBeInTheDocument()
  })
})
