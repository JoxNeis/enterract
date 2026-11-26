import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FilterBuilder, type FilterBuilderProps } from './FilterBuilder'
import { orderFields, orders, sampleFilter } from './FilterBuilder.fixtures'
import { evaluateFilter, type FilterGroup } from './filterModel'
import { must } from '../../test/must'

function Live(args: FilterBuilderProps) {
  const [filter, setFilter] = useState<FilterGroup>(args.defaultValue ?? sampleFilter)
  const matches = orders.filter((o) => evaluateFilter(filter, o))
  return (
    <>
      <FilterBuilder
        {...args}
        defaultValue={undefined}
        value={filter}
        onChange={(v) => {
          setFilter(v)
          args.onChange?.(v)
        }}
      />
      <p style={{ fontSize: 12, marginTop: 12 }}>
        Matching orders: <strong>{matches.map((o) => `#${String(o.id)} ${o.customer}`).join(', ') || 'none'}</strong>
      </p>
    </>
  )
}

const meta = {
  title: 'Components/FilterBuilder',
  component: FilterBuilder,
  args: { fields: orderFields, defaultValue: sampleFilter, maxDepth: 2, showSummary: true, readOnly: false, onChange: fn() },
  argTypes: { fields: { control: false }, defaultValue: { control: false }, value: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 760 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Live {...args} />,
} satisfies Meta<typeof FilterBuilder>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(must(within(canvasElement).getAllByRole('button', { name: 'Add condition' })[0]))
    await expect(args.onChange).toHaveBeenCalled()
  },
}

export const Empty: Story = { args: { defaultValue: { kind: 'group', id: 'root', combinator: 'and', rules: [] } } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Disabled: Story = { args: { readOnly: true, showSummary: false } }
