import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { MatrixEditor } from './MatrixEditor'

const sizes = ['XS', 'S', 'M', 'L', 'XL'].map((s) => ({ key: s, label: s }))
const colors = [
  { key: 'black', label: 'Black' },
  { key: 'navy', label: 'Navy' },
  { key: 'grey', label: 'Grey' },
]

const meta = {
  title: 'Components/MatrixEditor',
  component: MatrixEditor,
  args: {
    'aria-label': 'Order quantities by size and color',
    rows: sizes,
    columns: colors,
    rowHeader: 'Size',
    defaultValue: { S: { black: 12, navy: 6 }, M: { black: 24, grey: 10 }, L: { navy: 8 } },
    precision: 0,
    showTotals: true,
    readOnly: false,
    onChange: fn(),
  },
  argTypes: { rows: { control: false }, columns: { control: false }, defaultValue: { control: false } },
} satisfies Meta<typeof MatrixEditor>

export default meta
type Story = StoryObj<typeof meta>

/** Click a cell and type (or press Enter/F2); Enter saves and moves down, Tab moves right. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('gridcell', { name: /^XL, Grey:/ }))
    await userEvent.keyboard('4{Enter}')
    await expect(args.onChange).toHaveBeenCalled()
  },
}

/**
 * Works like a small spreadsheet: drag to select, Ctrl+C / Ctrl+V with Excel (a single value fills
 * the selection), drag the fill handle or press Ctrl+D / Ctrl+R, Delete to clear.
 */
export const ExcelSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: canvas.getByRole('gridcell', { name: /^S, Black:/ }) },
      { target: canvas.getByRole('gridcell', { name: /^M, Navy:/ }) },
      { keys: '[/MouseLeft]' },
    ])
    await waitFor(() => expect(canvas.getByText('Sum: 42')).toBeVisible())
    await expect(canvas.getByRole('gridcell', { name: /^M, Navy:/ })).toHaveAttribute('aria-selected', 'true')
  },
}

export const BudgetByPeriod: Story = {
  args: {
    'aria-label': 'Budget by account and month',
    rowHeader: 'Account',
    precision: 2,
    rows: [
      { key: '6100', label: '6100 Salaries' },
      { key: '6200', label: '6200 Rent' },
      { key: '6300', label: '6300 Travel' },
    ],
    columns: ['Jan', 'Feb', 'Mar'].map((m) => ({ key: m, label: m })),
    defaultValue: { '6100': { Jan: 42000, Feb: 42000, Mar: 43500 }, '6200': { Jan: 9000, Feb: 9000, Mar: 9000 } },
  },
}

export const ReadOnly: Story = { args: { readOnly: true } }

export const Disabled: Story = { args: { readOnly: true, showTotals: false } }
