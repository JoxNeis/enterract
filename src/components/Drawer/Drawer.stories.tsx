import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { Button } from '../Button'
import { TextField } from '../TextField'
import { Drawer, type DrawerProps } from './Drawer'

function Demo(args: DrawerProps) {
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
        New customer
      </Button>
      <Drawer
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
              Create
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <TextField
            label='Name'
            required
          />
          <TextField label='Email' />
          <TextField label='City' />
        </div>
      </Drawer>
    </>
  )
}

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  args: { open: false, title: 'New customer', side: 'right', size: 'sm', closeOnBackdrop: true, onClose: fn() },
  argTypes: {
    side: { control: 'inline-radio', options: ['right', 'left'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    footer: { control: false },
  },
  render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'New customer' }))
    await expect(screen.getByRole('dialog', { name: 'New customer' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect(args.onClose).toHaveBeenCalled()
  },
}

export const Left: Story = { args: { side: 'left' } }

export const Large: Story = { args: { size: 'lg' } }

export const Disabled: Story = { args: { closeOnBackdrop: false } }
