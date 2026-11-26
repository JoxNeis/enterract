import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
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
  },
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['button', 'submit', 'reset'],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

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
