import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test'
import { SignatureField, type SignatureFieldProps } from './SignatureField'
import { drawnSignature, fixedNow, typedSignature } from './SignatureField.fixtures'

function Stateful(args: SignatureFieldProps) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <SignatureField
      {...args}
      value={value}
      onChange={(v) => {
        setValue(v)
        args.onChange?.(v)
      }}
    />
  )
}

const meta = {
  title: 'Components/SignatureField',
  component: SignatureField,
  args: {
    label: 'Received by',
    statement: 'I confirm the goods on delivery note DN-55120 were received in good condition.',
    value: null,
    now: fixedNow,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    defaultMode: { control: 'inline-radio', options: ['draw', 'type'] },
    now: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 520 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof SignatureField>

export default meta
type Story = StoryObj<typeof meta>

/** Draw with mouse, pen or finger. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const pad = within(canvasElement).getByRole('img', { name: /Signature pad/ })
    const rect = pad.getBoundingClientRect()
    const at = (x: number, y: number) => ({ clientX: rect.left + x, clientY: rect.top + y, pointerId: 1, buttons: 1 })
    await fireEvent.pointerDown(pad, at(30, 90))
    for (const [x, y] of [[80, 30], [120, 100], [170, 40], [220, 95], [280, 50], [330, 80]] as const) await fireEvent.pointerMove(pad, at(x, y))
    await fireEvent.pointerUp(pad, at(330, 80))
    await waitFor(() => expect(args.onChange).toHaveBeenCalledWith(expect.objectContaining({ mode: 'draw', signedAt: '2026-03-15T09:00:00Z' })))
  },
}

/** Keyboard-accessible alternative: type your name. */
export const TypeName: Story = {
  args: { defaultMode: 'type', label: 'Approved by', statement: undefined },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Full name' }), 'Dana Whitfield')
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'type', name: 'Dana Whitfield' })))
  },
}

export const Signed: Story = { args: { value: drawnSignature } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true, value: drawnSignature } }

export const ReadOnlyTyped: Story = { args: { readOnly: true, value: typedSignature, statement: undefined, label: 'Approved by' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Sign to confirm receipt' } }

export const Compact: Story = { args: { size: 'sm', statement: undefined } }
