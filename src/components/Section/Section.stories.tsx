import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '../Button'
import { DatePicker } from '../DatePicker'
import { TextField } from '../TextField'
import { Section } from './Section'

const fields = (
  <>
    <TextField label='Street' />
    <TextField label='City' />
    <TextField label='Postal code' />
    <DatePicker
      label='Delivery date'
      today='2026-03-15'
    />
  </>
)

const meta = {
  title: 'Components/Section',
  component: Section,
  args: {
    title: 'Shipping address',
    description: 'Where the goods are delivered',
    collapsible: false,
    defaultExpanded: true,
    invalid: false,
    headingLevel: 3,
    columns: 2,
    onExpandedChange: fn(),
    children: fields,
  },
  argTypes: {
    children: { control: false },
    actions: { control: false },
    headingLevel: { control: 'inline-radio', options: [2, 3, 4, 5] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Section>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithActions: Story = { args: { actions: <Button size='sm'>Copy from billing</Button> } }

export const Collapsible: Story = {
  args: { collapsible: true },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Shipping address' }))
    await expect(args.onExpandedChange).toHaveBeenCalledWith(false, undefined)
  },
}

export const CollapsedWithErrors: Story = { args: { collapsible: true, defaultExpanded: false, invalid: true } }

export const Disabled: Story = { args: { collapsible: true, defaultExpanded: false } }
