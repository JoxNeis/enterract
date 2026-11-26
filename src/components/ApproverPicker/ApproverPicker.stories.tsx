import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { employeeSource, type SampleEmployee } from '../../test/erpFixtures'
import { ApproverPicker } from './ApproverPicker'

const meta = {
  title: 'Components/ApproverPicker',
  component: ApproverPicker<SampleEmployee>,
  args: {
    label: 'Approval chain',
    dataSource: employeeSource,
    defaultValue: ['E304'],
    sequential: true,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: { dataSource: { control: false }, size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 380 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ApproverPicker<SampleEmployee>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox', { name: 'Add approver' }), 'anna')
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenLastCalledWith(['E304', 'E305'])
  },
}

export const Parallel: Story = { args: { sequential: false, defaultValue: ['E301', 'E305'] } }

export const ExcludeRequester: Story = { args: { excludeIds: ['E301'], helpText: 'Dewi Lestari requested this and cannot approve' } }

export const MaxTwo: Story = { args: { maxApprovers: 2, defaultValue: ['E304', 'E305'] } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: ['E304', 'E305'] } }

export const Required: Story = { args: { required: true, defaultValue: [] } }

export const WithError: Story = { args: { defaultValue: [], error: 'Add at least one approver' } }

export const Compact: Story = { args: { size: 'sm' } }
