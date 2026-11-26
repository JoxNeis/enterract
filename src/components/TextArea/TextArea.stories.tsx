import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { TextArea, type TextAreaProps } from './TextArea'

function Stateful(args: TextAreaProps) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <TextArea
      {...args}
      value={value}
      onChange={(v, e) => {
        setValue(v)
        args.onChange?.(v, e)
      }}
    />
  )
}

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  args: {
    label: 'Internal notes',
    value: null,
    rows: 3,
    autoGrow: false,
    showCount: false,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof TextArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AutoGrow: Story = { args: { autoGrow: true, rows: 2, maxRows: 8, helpText: 'Grows up to 8 lines' } }

export const CharacterCounter: Story = {
  args: { maxLength: 120, showCount: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox'), 'Deliver to dock 4')
    await expect(canvas.getByText('17 / 120')).toBeVisible()
  },
}

export const Disabled: Story = { args: { disabled: true, value: 'Customer asked for split delivery.' } }

export const ReadOnly: Story = { args: { readOnly: true, value: 'Approved by finance on 2026-03-15.' } }

export const Required: Story = { args: { required: true, label: 'Rejection reason' } }

export const WithError: Story = { args: { required: true, label: 'Rejection reason', error: 'Give a reason for rejecting' } }

export const Compact: Story = { args: { size: 'sm', rows: 2 } }
