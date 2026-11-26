import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../Button'
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog'

function Demo(args: ConfirmDialogProps) {
  const [open, setOpen] = useState(args.open)
  return (
    <>
      <Button
        variant={args.tone === 'danger' ? 'danger' : 'primary'}
        onClick={() => {
          setOpen(true)
        }}
      >
        {args.confirmLabel ?? 'Confirm'}
      </Button>
      <ConfirmDialog
        {...args}
        open={open}
        onCancel={() => {
          setOpen(false)
          args.onCancel()
        }}
        onConfirm={async (reason) => {
          await new Promise((r) => setTimeout(r, 300))
          setOpen(false)
          await args.onConfirm(reason)
        }}
      />
    </>
  )
}

const meta = {
  title: 'Components/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    open: false,
    title: 'Post invoice INV-2026-0142?',
    message: 'Posted invoices cannot be edited.',
    confirmLabel: 'Post',
    tone: 'default',
    requireReason: false,
    onConfirm: fn(),
    onCancel: fn(),
  },
  argTypes: { tone: { control: 'inline-radio', options: ['default', 'danger'] } },
  render: (args) => <Demo {...args} />,
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Post' }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Post' }))
    await waitFor(() => expect(args.onConfirm).toHaveBeenCalledWith(undefined))
  },
}

export const Destructive: Story = {
  args: { title: 'Delete sales order SO-1043?', message: 'This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' },
}

export const RejectWithReason: Story = {
  args: { title: 'Reject purchase request?', message: undefined, confirmLabel: 'Reject', tone: 'danger', requireReason: true },
}

export const Disabled: Story = { args: { open: true } }
