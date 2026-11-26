import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { DrillLink } from './DrillLink'

const meta = {
  title: 'Components/DrillLink',
  component: DrillLink,
  args: { children: '$48,210', target: 'Overdue invoices', onDrill: fn(), disabled: false },
} satisfies Meta<typeof DrillLink>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'))
    await expect(args.onDrill).toHaveBeenCalled()
  },
}

export const InTable: Story = {
  render: (args) => (
    <table style={{ borderCollapse: 'collapse', fontSize: 14 }}>
      <tbody>
        <tr>
          <th style={{ textAlign: 'left', paddingRight: 24 }}>Open orders</th>
          <td>
            <DrillLink
              {...args}
              target='Open orders'
            >
              128
            </DrillLink>
          </td>
        </tr>
        <tr>
          <th style={{ textAlign: 'left', paddingRight: 24 }}>Overdue invoices</th>
          <td>
            <DrillLink {...args} />
          </td>
        </tr>
      </tbody>
    </table>
  ),
}

export const Disabled: Story = { args: { disabled: true } }
