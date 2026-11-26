import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { CascadingSelect } from './CascadingSelect'
import { addressLevels } from './CascadingSelect.fixtures'

const meta = {
  title: 'Components/CascadingSelect',
  component: CascadingSelect,
  args: {
    label: 'Delivery region',
    levels: addressLevels,
    orientation: 'horizontal',
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    levels: { control: false },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CascadingSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Country' }))
    await userEvent.click(screen.getByRole('option', { name: 'Germany' }))
    await userEvent.click(canvas.getByRole('combobox', { name: 'State' }))
    await userEvent.click(screen.getByRole('option', { name: 'Bavaria' }))
    await expect(args.onChange).toHaveBeenLastCalledWith(['DE', 'BY', null])
  },
}

export const Prefilled: Story = { args: { defaultValue: ['ID', 'JI', 'SBY'] } }

export const Vertical: Story = { args: { orientation: 'vertical' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: ['ID', 'JK', 'JKT-S'] } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: ['ID', 'JK', 'JKT-S'] } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { error: 'Choose a city', defaultValue: ['DE', 'HH', null] } }

export const Compact: Story = { args: { size: 'sm' } }
