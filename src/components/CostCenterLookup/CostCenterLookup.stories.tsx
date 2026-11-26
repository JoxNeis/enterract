import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { costCenterSource, type SampleCodeName } from '../../test/erpFixtures'
import { CostCenterLookup } from './CostCenterLookup'

const meta = {
  title: 'Components/CostCenterLookup',
  component: CostCenterLookup<SampleCodeName>,
  args: {
    dataSource: costCenterSource,
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
} satisfies Meta<typeof CostCenterLookup<SampleCodeName>>

export default meta
type Story = StoryObj<typeof meta>

/** Type to search or press F4 to browse. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), 'IT')
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('CC150', expect.anything())
  },
}

export const WithValue: Story = { args: { defaultValue: 'CC150' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: 'CC150' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'CC150' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Cost center is required' } }

export const Compact: Story = { args: { size: 'sm' } }
