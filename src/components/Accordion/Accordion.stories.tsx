import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { TextField } from '../TextField'
import { Accordion } from './Accordion'

const items = [
  {
    key: 'billing',
    title: 'Billing address',
    content: (
      <div style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
        <TextField label='Street' />
        <TextField label='City' />
      </div>
    ),
  },
  { key: 'shipping', title: 'Shipping', meta: 'Same as billing', content: 'Uses the billing address.' },
  { key: 'tax', title: 'Tax', invalid: true, content: 'Tax ID is missing.' },
  { key: 'bank', title: 'Bank details', disabled: true, content: 'Locked by finance.' },
]

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  args: { items, defaultExpanded: ['billing'], allowMultiple: false, headingLevel: 3, onExpandedChange: fn() },
  argTypes: { items: { control: false }, headingLevel: { control: 'inline-radio', options: [2, 3, 4, 5] } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 520 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /^shipping/i }))
    await expect(args.onExpandedChange).toHaveBeenLastCalledWith(['shipping'])
  },
}

export const Multiple: Story = { args: { allowMultiple: true, defaultExpanded: ['billing', 'tax'] } }

export const Disabled: Story = { args: { items: items.map((i) => ({ ...i, disabled: true })), defaultExpanded: [] } }
