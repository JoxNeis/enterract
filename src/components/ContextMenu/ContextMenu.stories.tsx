import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn, screen, userEvent, within } from 'storybook/test'
import { Icon } from '../Icon'
import { ContextMenu } from './ContextMenu'

const items = [
  { key: 'open', label: 'Open', icon: <Icon name='external' /> },
  { key: 'duplicate', label: 'Duplicate', icon: <Icon name='copy' /> },
  { key: 'print', label: 'Print', icon: <Icon name='print' />, shortcut: 'Ctrl+P' },
  { key: 'delete', label: 'Delete', icon: <Icon name='trash' />, danger: true, separatorBefore: true },
]

const meta = {
  title: 'Components/ContextMenu',
  component: ContextMenu,
  args: {
    items,
    onSelect: fn(),
    disabled: false,
    children: (
      <div
        tabIndex={0}
        style={{ padding: 24, border: '1px dashed var(--erp-color-border)', borderRadius: 8, width: 320 }}
      >
        Right-click here, or focus and press Shift+F10
      </div>
    ),
  },
  argTypes: { items: { control: false }, children: { control: false } },
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await fireEvent.contextMenu(within(canvasElement).getByText(/right-click here/i), { clientX: 60, clientY: 60 })
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(args.onSelect).toHaveBeenCalledWith('duplicate', expect.anything())
    await expect(screen.queryByRole('menu')).toBeNull()
  },
}

export const Disabled: Story = { args: { disabled: true } }
