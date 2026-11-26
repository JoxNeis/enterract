import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Fab } from './Fab'

const meta = {
  title: 'Components/Fab',
  component: Fab,
  args: { icon: 'add', 'aria-label': 'New sales order', position: 'static', onClick: fn(), disabled: false },
  argTypes: { position: { control: 'inline-radio', options: ['static', 'bottom-right', 'bottom-left'] } },
} satisfies Meta<typeof Fab>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'New sales order' }))
    await expect(args.onClick).toHaveBeenCalled()
  },
}

export const Extended: Story = { args: { label: 'New order' } }

export const Floating: Story = { args: { position: 'bottom-right' } }

export const Disabled: Story = { args: { disabled: true } }
