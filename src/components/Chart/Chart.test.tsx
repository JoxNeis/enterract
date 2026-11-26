import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Chart } from './Chart'
import { months, regions, revenueVsCost, shareByRegion } from './Chart.fixtures'
import { niceTicks } from './scale'

describe('niceTicks', () => {
  it('produces round ticks including zero', () => {
    expect(niceTicks(0, 248900)).toEqual([0, 50000, 100000, 150000, 200000, 250000])
    expect(niceTicks(-12, 30)).toContain(0)
  })
})

describe('Chart', () => {
  it('renders a labelled figure with a legend for two series', () => {
    render(
      <Chart
        type='bar'
        title='Revenue vs cost'
        categories={months}
        series={revenueVsCost}
        className='extra'
      />
    )
    const figure = screen.getByRole('figure', { name: 'Revenue vs cost' })
    expect(figure).toHaveClass('erp-chart', 'extra')
    expect(within(screen.getByRole('list', { name: 'Legend' })).getAllByRole('listitem')).toHaveLength(2)
  })

  it('focusable points describe every series and show a tooltip', () => {
    render(
      <Chart
        type='line'
        title='Revenue'
        categories={months}
        series={revenueVsCost}
        valueFormat={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
      />
    )
    const point = screen.getByRole('img', { name: /^Mar: Revenue \$214,300, Cost of sales \$139,900$/ })
    fireEvent.focus(point)
    expect(screen.getByRole('status')).toHaveTextContent('Mar')
  })

  it('toggles a table view', async () => {
    render(
      <Chart
        type='pie'
        title='Share'
        categories={regions}
        series={shareByRegion}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Show table' }))
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Hamburg' })).toBeInTheDocument()
  })

  it('folds more than eight series into Other', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ name: `S${String(i + 1)}`, values: [i, i] }))
    render(
      <Chart
        type='stacked-bar'
        title='Many'
        categories={['A', 'B']}
        series={many}
      />
    )
    const legend = within(screen.getByRole('list', { name: 'Legend' })).getAllByRole('listitem')
    expect(legend).toHaveLength(8)
    expect(legend[7]).toHaveTextContent('Other')
  })
})
