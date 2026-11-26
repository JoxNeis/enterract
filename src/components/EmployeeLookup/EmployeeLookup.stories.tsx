import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { employeeSource, type SampleEmployee } from '../../test/erpFixtures'
import { EmployeeLookup } from './EmployeeLookup'

const meta = {
  title: 'Components/EmployeeLookup',
  component: EmployeeLookup<SampleEmployee>,
  args: {
    dataSource: employeeSource,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    dataSource: { control: false },
    columns: { control: false },
    displayValue: { control: false },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmployeeLookup<SampleEmployee>>

export default meta
type Story = StoryObj<typeof meta>

/** Type to search or press F4 to browse. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), 'anna')
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('E305', expect.anything())
  },
}

export const WithValue: Story = { args: { defaultValue: 'E305' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: 'E305' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'E305' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Employee is required' } }

export const Compact: Story = { args: { size: 'sm' } }
