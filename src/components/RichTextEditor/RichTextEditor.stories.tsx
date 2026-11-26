import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { RichTextEditor, type RichTextEditorProps } from './RichTextEditor'
import { approvalNote, paymentTerms } from './RichTextEditor.fixtures'

function Stateful(args: RichTextEditorProps) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <RichTextEditor
      {...args}
      value={value}
      onChange={(html) => {
        setValue(html)
        args.onChange?.(html)
      }}
    />
  )
}

const meta = {
  title: 'Components/RichTextEditor',
  component: RichTextEditor,
  args: {
    label: 'Terms and conditions',
    value: null,
    placeholder: 'Add terms printed on the quote…',
    rows: 6,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof RichTextEditor>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const box = canvas.getByRole('textbox', { name: 'Terms and conditions' })
    await userEvent.click(box)
    await userEvent.type(box, 'Net 30')
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith(expect.stringContaining('Net 30')))
  },
}

/** Existing formatted content: heading, emphasis, a list and a link. */
export const WithContent: Story = { args: { value: paymentTerms } }

/** The toolbar works on the selection; Ctrl+B / Ctrl+I / Ctrl+U / Ctrl+K also work. */
export const Formatting: Story = {
  args: { label: 'Email body', value: null },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const box = canvas.getByRole('textbox', { name: 'Email body' })
    await userEvent.click(box)
    await userEvent.click(canvas.getByRole('button', { name: 'Bold (Ctrl+B)' }))
    await userEvent.type(box, 'Urgent')
    await waitFor(() => expect(args.onChange).toHaveBeenLastCalledWith(expect.stringMatching(/<(strong|b)>Urgent/)))
  },
}

export const CharacterLimit: Story = {
  args: { label: 'Remark on invoice', value: approvalNote, maxLength: 80, rows: 3 },
}

export const Disabled: Story = { args: { disabled: true, value: approvalNote } }

export const ReadOnly: Story = {
  args: { readOnly: true, value: paymentTerms },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('toolbar')).not.toBeInTheDocument()
  },
}

export const Required: Story = { args: { required: true, label: 'Reason for change' } }

export const WithError: Story = { args: { required: true, label: 'Reason for change', error: 'Describe what changed and why' } }

export const Compact: Story = { args: { size: 'sm', rows: 3 } }
