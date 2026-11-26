import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { Icon } from '../Icon'
import { SplitButton } from './SplitButton'

const meta = {
  title: 'Components/SplitButton',
  component: SplitButton,
  parameters: { layout: 'centered' },
  args: {
    children: 'Save',
    icon: <Icon name='save' />,
    onClick: fn(),
    onSelect: fn(),
    items: [
      { key: 'saveNew', label: 'Save & New' },
      { key: 'saveClose', label: 'Save & Close', shortcut: 'Ctrl+Shift+S' },
      { key: 'draft', label: 'Save as draft' },
    ],
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
  },
  argTypes: {
    items: { control: false },
    icon: { control: false },
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'danger', 'ghost'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof SplitButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'More options' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Save & New' }))
    await expect(args.onSelect).toHaveBeenCalledWith('saveNew')
  },
}

export const Secondary: Story = { args: { variant: 'secondary', children: 'Print', icon: <Icon name='print' /> } }

export const Loading: Story = { args: { loading: true } }

export const Compact: Story = { args: { size: 'sm' } }

export const Disabled: Story = { args: { disabled: true } }
