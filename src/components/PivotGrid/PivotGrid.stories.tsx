import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { PivotFieldList } from '../PivotFieldList'
import type { PivotConfig } from './pivot'
import { PivotGrid } from './PivotGrid'
import { salesConfig, salesFieldLabels, salesRecords } from './PivotGrid.fixtures'

const meta = {
  title: 'Components/PivotGrid',
  component: PivotGrid,
  args: {
    'aria-label': 'Revenue by region and quarter',
    data: salesRecords,
    config: salesConfig,
    fieldLabels: salesFieldLabels,
    valueFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    showSubtotals: true,
    showGrandTotals: true,
  },
  argTypes: { data: { control: false }, config: { control: false }, fieldLabels: { control: false }, valueFormat: { control: false } },
} satisfies Meta<typeof PivotGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole('button', { name: 'Hamburg' })
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  },
}

/**
 * Value cells select like Excel (click, drag, Shift+arrows) and show Average/Count/Sum. Ctrl+C
 * copies the numbers for Excel; Ctrl+Shift+C includes the row and column headers.
 */
export const SelectAndCopy: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [first] = canvas.getAllByRole('gridcell')
    if (!first) throw new Error('no value cells')
    await userEvent.click(first)
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowRight}{/Shift}')
    await expect(canvas.getByText('Count: 4')).toBeVisible()
    const data = new DataTransfer()
    first.dispatchEvent(new ClipboardEvent('copy', { clipboardData: data, bubbles: true, cancelable: true }))
    await expect(data.getData('text/plain')).toMatch(/^[\d.]+\t[\d.]+\n[\d.]+\t[\d.]+$/)
  },
}

export const TwoMeasures: Story = {
  args: {
    config: {
      rows: ['category'],
      columns: ['region'],
      values: [
        { field: 'revenue', aggregate: 'sum' },
        { field: 'orders', aggregate: 'sum' },
      ],
    },
    valueFormat: undefined,
  },
}

/** Change rows, columns and values with the PivotFieldList. */
export const WithFieldList: Story = {
  render: (args) => <Configurable {...args} />,
}

function Configurable(args: Parameters<typeof PivotGrid>[0]) {
  const [config, setConfig] = useState<PivotConfig>(args.config)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
      <PivotFieldList
        fields={[
          { key: 'region', label: 'Region' },
          { key: 'category', label: 'Category' },
          { key: 'quarter', label: 'Quarter' },
          { key: 'revenue', label: 'Revenue', numeric: true },
          { key: 'orders', label: 'Orders', numeric: true },
        ]}
        value={config}
        onChange={setConfig}
      />
      <PivotGrid
        {...args}
        config={config}
      />
    </div>
  )
}

export const Disabled: Story = { args: { showSubtotals: false, showGrandTotals: false } }
