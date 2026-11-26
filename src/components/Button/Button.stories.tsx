import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Icon } from '../Icon'
import { Button } from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Button',
    onClick: fn(),
    variant: 'secondary',
    size: 'md',
    loading: false,
    disabled: false,
  },
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['button', 'submit', 'reset'],
    },
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'danger', 'ghost'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    icon: { control: false },
    iconEnd: { control: false },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Primary: Story = {
  args: { variant: 'primary', children: 'Save' },
}

export const Danger: Story = {
  args: { variant: 'danger', children: 'Delete' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Cancel' },
}

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button
        {...args}
        size='sm'
      >
        Small
      </Button>
      <Button
        {...args}
        size='md'
      >
        Medium
      </Button>
    </div>
  ),
}

export const WithIcon: Story = {
  args: { variant: 'primary', icon: <Icon name='save' />, children: 'Save' },
}

export const Loading: Story = {
  args: { variant: 'primary', loading: true, children: 'Saving…' },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const LongLabel: Story = {
  args: {
    children: 'Save all changes and continue',
  },
}

export const InsideForm: Story = {
  args: {
    type: 'submit',
    children: 'Submit',
  },
  decorators: [
    (Story) => (
      <form
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <Story />
      </form>
    ),
  ],
}
