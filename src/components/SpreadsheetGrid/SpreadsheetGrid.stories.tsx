import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { SpreadsheetGrid } from './SpreadsheetGrid'

const budget = {
  A1: 'Cost item',
  B1: 'Q1',
  C1: 'Q2',
  D1: 'Total',
  A2: 'Salaries',
  B2: '42000',
  C2: '43500',
  D2: '=SUM(B2:C2)',
  A3: 'Rent',
  B3: '9000',
  C3: '9000',
  D3: '=SUM(B3:C3)',
  A4: 'Travel',
  B4: '3200',
  C4: '4100',
  D4: '=SUM(B4:C4)',
  A5: 'Total',
  B5: '=SUM(B2:B4)',
  C5: '=SUM(C2:C4)',
  D5: '=SUM(D2:D4)',
  A6: 'Q2 vs Q1',
  C6: '=ROUND((C5-B5)/B5*100, 1)',
}

const meta = {
  title: 'Components/SpreadsheetGrid',
  component: SpreadsheetGrid,
  args: { 'aria-label': 'Department budget', defaultValue: budget, rows: 12, columns: 6, readOnly: false, onChange: fn() },
  argTypes: { defaultValue: { control: false }, value: { control: false }, numberFormat: { control: false } },
} satisfies Meta<typeof SpreadsheetGrid>

export default meta
type Story = StoryObj<typeof meta>

/** Edit B2 and watch the totals update. Try `=AVERAGE(B2:B4)`. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('gridcell', { name: /^B2:/ }))
    await userEvent.keyboard('50000{Enter}')
    await expect(args.onChange).toHaveBeenCalled()
    await expect(canvas.getByRole('gridcell', { name: /^B5: 62,200/ })).toBeVisible()
  },
}

/**
 * Drag the fill handle (the square at the bottom-right of the selection) to copy a formula down:
 * relative references move with it, `$` references stay fixed. Ctrl+D and Ctrl+R do the same.
 */
export const FillFormulas: Story = {
  args: {
    rows: 6,
    columns: 4,
    defaultValue: {
      A1: 'Qty',
      B1: 'Price',
      C1: 'Amount',
      D1: '1.1',
      A2: '2',
      B2: '10',
      C2: '=A2*B2*$D$1',
      A3: '3',
      B3: '12',
      A4: '5',
      B4: '9',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('gridcell', { name: /^C2/ }))
    const handle = canvasElement.querySelector('.erp-fill-handle')
    if (!handle) throw new Error('fill handle missing')
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: handle },
      { target: canvas.getByRole('gridcell', { name: /^C4/ }) },
      { keys: '[/MouseLeft]' },
    ])
    await waitFor(() => expect(canvas.getByRole('gridcell', { name: /^C4: 49\.5, formula =A4\*B4\*\$D\$1/ })).toBeVisible())
  },
}

export const Empty: Story = { args: { defaultValue: {} } }

export const Errors: Story = { args: { defaultValue: { A1: '=A2', A2: '=A1', B1: '=1/0', C1: '=SUMX(1)' } } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Disabled: Story = { args: { readOnly: true, rows: 6, columns: 4 } }
