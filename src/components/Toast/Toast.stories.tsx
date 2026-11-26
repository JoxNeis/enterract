import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../Button'
import { ToastProvider, type ToastProviderProps } from './Toast'
import { useToast } from './toastContext'

function Demo() {
  const toast = useToast()
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button
        onClick={() => {
          toast.success('Sales order SO-1043 saved')
        }}
      >
        Success
      </Button>
      <Button
        onClick={() => {
          toast.show({ tone: 'info', title: 'Sync finished', message: '128 items updated' })
        }}
      >
        Info
      </Button>
      <Button
        onClick={() => {
          toast.show({ tone: 'warning', message: 'Stock below reorder point for 3 items' })
        }}
      >
        Warning
      </Button>
      <Button
        onClick={() => {
          toast.error('Posting failed: period 2026-03 is closed')
        }}
      >
        Error (sticky)
      </Button>
      <Button
        onClick={() => {
          toast.show({ message: '2 lines deleted', action: { label: 'Undo', onClick: fn() } })
        }}
      >
        With undo
      </Button>
    </div>
  )
}

const meta = {
  title: 'Components/Toast',
  component: ToastProvider,
  args: { position: 'bottom-right', max: 4 },
  argTypes: {
    position: { control: 'inline-radio', options: ['bottom-right', 'bottom-left', 'top-right', 'top-center'] },
  },
  render: (args: ToastProviderProps) => (
    <ToastProvider {...args}>
      <Demo />
    </ToastProvider>
  ),
} satisfies Meta<typeof ToastProvider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Success' }))
    await waitFor(() => expect(screen.getByText('Sales order SO-1043 saved')).toBeVisible())
  },
}

export const TopCenter: Story = { args: { position: 'top-center' } }

export const Disabled: Story = { args: { max: 1 } }
