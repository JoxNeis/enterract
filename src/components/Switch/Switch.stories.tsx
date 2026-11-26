import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Switch } from './Switch'

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: {
    label: 'Active customer',
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    labelPosition: { control: 'inline-radio', options: ['start', 'end'] },
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('switch'))
    await expect(args.onChange).toHaveBeenCalledWith(true, expect.anything())
  },
}

export const On: Story = { args: { defaultValue: true } }

export const LabelStart: Story = {
  args: { labelPosition: 'start', label: 'Email notifications' },
  decorators: [
    (Story) => (
      <div style={{ width: 280, display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
}

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: true } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { error: 'Blocked customers cannot be activated' } }

export const Compact: Story = { args: { size: 'sm' } }
