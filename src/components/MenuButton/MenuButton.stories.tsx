import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { Icon } from '../Icon'
import { MenuButton } from './MenuButton'

const items = [
  { key: 'pdf', label: 'Export PDF', icon: <Icon name='file' />, shortcut: 'Ctrl+P' },
  { key: 'xlsx', label: 'Export Excel', icon: <Icon name='grid' /> },
  { key: 'csv', label: 'Export CSV', icon: <Icon name='download' /> },
  { key: 'archive', label: 'Archive', disabled: true },
  { key: 'delete', label: 'Delete', icon: <Icon name='trash' />, danger: true, separatorBefore: true },
]

const meta = {
  title: 'Components/MenuButton',
  component: MenuButton,
  parameters: { layout: 'centered' },
  args: { children: 'Export', items, onSelect: fn(), variant: 'secondary', size: 'md', disabled: false },
  argTypes: {
    items: { control: false },
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'danger', 'ghost'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof MenuButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    within(canvasElement).getByRole('button', { name: 'Export' }).focus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    await expect(args.onSelect).toHaveBeenCalledWith('xlsx')
  },
}

export const IconOnly: Story = {
  args: { children: undefined, 'aria-label': 'More actions', icon: <Icon name='more' />, hideChevron: true, variant: 'ghost' },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'More actions' }))
    await expect(screen.getByRole('menu')).toBeVisible()
  },
}

export const Compact: Story = { args: { size: 'sm' } }

export const Disabled: Story = { args: { disabled: true } }
