import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { icons } from '../Icon'
import { IconButton } from './IconButton'

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: { layout: 'centered' },
  args: {
    icon: 'trash',
    'aria-label': 'Delete line',
    variant: 'ghost',
    size: 'md',
    loading: false,
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    icon: { control: 'select', options: Object.keys(icons) },
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'danger', 'ghost'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Delete line' }))
    await expect(args.onClick).toHaveBeenCalled()
  },
}

export const Toolbar: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 4 }}>
      <IconButton
        {...args}
        icon='add'
        aria-label='Add line'
      />
      <IconButton
        {...args}
        icon='copy'
        aria-label='Duplicate line'
      />
      <IconButton
        {...args}
        icon='print'
        aria-label='Print'
      />
      <IconButton
        {...args}
        icon='trash'
        aria-label='Delete line'
        variant='danger'
      />
    </div>
  ),
}

export const Secondary: Story = { args: { variant: 'secondary', icon: 'filter', 'aria-label': 'Filter' } }

export const Loading: Story = { args: { loading: true, icon: 'refresh', 'aria-label': 'Refresh' } }

export const Compact: Story = { args: { size: 'sm' } }

export const Disabled: Story = { args: { disabled: true } }
