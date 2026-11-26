import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { Button } from '../Button'
import { TextField } from '../TextField'
import { Dialog, type DialogProps } from './Dialog'

function Demo(args: DialogProps) {
  const [open, setOpen] = useState(args.open)
  const close = () => {
    setOpen(false)
    args.onClose()
  }
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true)
        }}
      >
        Edit address
      </Button>
      <Dialog
        {...args}
        open={open}
        onClose={close}
        footer={
          <>
            <Button
              variant='ghost'
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              variant='primary'
              onClick={close}
            >
              Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <TextField label='Street' />
          <TextField label='City' />
        </div>
      </Dialog>
    </>
  )
}

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  args: {
    open: false,
    title: 'Edit delivery address',
    description: 'Changes apply to this order only.',
    size: 'md',
    closeOnBackdrop: true,
    onClose: fn(),
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    role: { control: 'inline-radio', options: ['dialog', 'alertdialog'] },
    footer: { control: false },
  },
  render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Edit address' }))
    await expect(screen.getByRole('dialog', { name: 'Edit delivery address' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect(args.onClose).toHaveBeenCalled()
  },
}

export const Large: Story = { args: { size: 'lg' } }

export const Open: Story = { args: { open: true } }

export const Disabled: Story = { args: { closeOnBackdrop: false } }
