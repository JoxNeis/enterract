import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { TreeGrid, type TreeGridProps } from './TreeGrid'
import { costColumns, costRows, loadCostChildren, updateTree, type CostLine } from './TreeGrid.fixtures'

function Editable(args: TreeGridProps<CostLine>) {
  const [rows, setRows] = useState(args.rows)
  return (
    <TreeGrid<CostLine>
      {...args}
      rows={rows}
      onCellChange={(id, field, value) => {
        setRows((r) => updateTree(r, id, field, value))
        args.onCellChange?.(id, field, value)
      }}
    />
  )
}

const meta = {
  title: 'Components/TreeGrid',
  component: TreeGrid<CostLine>,
  args: {
    'aria-label': 'Project costs',
    rows: costRows,
    columns: costColumns,
    defaultExpanded: ['p', 'p1'],
    loadChildren: loadCostChildren,
    onCellChange: fn(),
    onExpandedChange: fn(),
    size: 'sm',
  },
  argTypes: {
    rows: { control: false },
    columns: { control: false },
    loadChildren: { control: false },
    renderActions: { control: false },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  render: (args) => <Editable {...args} />,
} satisfies Meta<typeof TreeGrid<CostLine>>

export default meta
type Story = StoryObj<typeof meta>

/** Parents sum their children. Double-click or press Enter on a leaf value to edit it. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('gridcell', { name: 'Budget: 90,000' }))
    await userEvent.keyboard('{Enter}{Control>}a{/Control}95000{Enter}')
    await expect(args.onCellChange).toHaveBeenCalledWith('p13', 'budget', 95000)
    await expect(canvas.getByRole('gridcell', { name: 'Budget: 555,000' })).toBeVisible()
  },
}

/** Select a block like Excel (drag, Shift+click, Shift+arrows) to see Sum/Average and copy it with Ctrl+C. */
export const SelectAndCopy: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('gridcell', { name: 'Budget: 120,000' }))
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{ArrowRight}{/Shift}')
    await expect(canvas.getByRole('gridcell', { name: 'Actual: 61,000' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByText('Sum: 1,082,300')).toBeVisible()
  },
}

export const Collapsed: Story = { args: { defaultExpanded: [] } }

export const Comfortable: Story = { args: { size: 'md' } }

export const Disabled: Story = { args: { onCellChange: undefined } }
