import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { ActionBar } from './ActionBar'
import { standardActions } from './actions'

const all = Object.keys(standardActions) as (keyof typeof standardActions)[]

const meta = {
  title: 'Components/ActionBar',
  component: ActionBar,
  args: {
    actions: all,
    context: { status: 'draft', isDirty: false, isApprover: false, isList: false },
    onAction: fn(),
    shortcuts: 'global',
    size: 'md',
  },
  argTypes: {
    actions: { control: false },
    shortcuts: { control: 'inline-radio', options: ['global', 'container', 'off'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof ActionBar>

export default meta
type Story = StoryObj<typeof meta>

/** Draft document: Save, Submit, Delete… Press Ctrl+S or Alt+N to try the shortcuts. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Save' }))
    await expect(args.onAction).toHaveBeenCalledWith('save', {})
  },
}

export const PendingApproval: Story = {
  args: { context: { status: 'pending-approval', isApprover: true } },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Reject' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Reject this document?' })
    await userEvent.type(within(dialog).getByRole('textbox'), 'Price is above the agreed rate')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }))
    await expect(args.onAction).toHaveBeenCalledWith('reject', { reason: 'Price is above the agreed rate' })
  },
}

export const Approved: Story = { args: { context: { status: 'approved' } } }

export const Posted: Story = { args: { context: { status: 'posted' } } }

export const DirtyCancel: Story = { args: { actions: ['save', 'cancel'], context: { status: 'draft', isDirty: true } } }

export const ListToolbar: Story = { args: { actions: ['new', 'export', 'import', 'print'], context: { isList: true } } }

export const Overflow: Story = { args: { maxVisible: 3 } }

export const Permissions: Story = { args: { context: { status: 'draft', permissions: ['edit', 'submit'] } } }

export const Compact: Story = { args: { size: 'sm' } }

export const Disabled: Story = {
  args: {
    actions: [{ id: 'sync', label: 'Sync now', icon: 'refresh', isEnabled: () => false }, 'print'],
  },
}
