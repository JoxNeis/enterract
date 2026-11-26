import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { departmentSource, type SampleCodeName } from '../../test/erpFixtures'
import { DepartmentLookup } from './DepartmentLookup'

const meta = {
  title: 'Components/DepartmentLookup',
  component: DepartmentLookup<SampleCodeName>,
  args: {
    dataSource: departmentSource,
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
} satisfies Meta<typeof DepartmentLookup<SampleCodeName>>

export default meta
type Story = StoryObj<typeof meta>

/** Type to search or press F4 to browse. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), 'purch')
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('D11', expect.anything())
  },
}

export const WithValue: Story = { args: { defaultValue: 'D11' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: 'D11' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'D11' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Department is required' } }

export const Compact: Story = { args: { size: 'sm' } }
