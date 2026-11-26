import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { Button } from '../Button'
import { Popover, type PopoverProps } from './Popover'

function PopoverDemo(args: PopoverProps) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(args.open)
  return (
    <>
      <Button
        ref={anchorRef}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o)
        }}
      >
        Toggle popover
      </Button>
      <Popover
        {...args}
        open={open}
        anchorRef={anchorRef}
        onClose={(reason) => {
          setOpen(false)
          args.onClose?.(reason)
        }}
      >
        <div style={{ padding: 12, width: 220 }}>Any content: a calendar, a list of options or a form.</div>
      </Popover>
    </>
  )
}

const meta = {
  title: 'Components/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
  args: {
    open: false,
    anchorRef: { current: null },
    placement: 'bottom-start',
    offset: 4,
    matchAnchorWidth: false,
    onClose: fn(),
  },
  argTypes: {
    anchorRef: { control: false },
    placement: {
      control: 'select',
      options: ['bottom-start', 'bottom-end', 'bottom', 'top-start', 'top-end', 'top', 'right-start', 'left-start'],
    },
  },
  render: (args) => <PopoverDemo {...args} />,
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'))
    await expect(screen.getByText(/any content/i)).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect(args.onClose).toHaveBeenCalledWith('escape')
  },
}

export const Open: Story = { args: { open: true } }

export const Top: Story = { args: { open: true, placement: 'top' } }

export const Disabled: Story = {
  render: () => <Button disabled>Popover trigger disabled</Button>,
}
