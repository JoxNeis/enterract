import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { TagInput } from './TagInput'

const meta = {
  title: 'Components/TagInput',
  component: TagInput,
  args: {
    label: 'CC recipients',
    placeholder: 'Type an email and press Enter',
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] }, validateTag: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TagInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('textbox'), 'ap@acme.com{Enter}ar@acme.com,')
    await expect(args.onChange).toHaveBeenLastCalledWith(['ap@acme.com', 'ar@acme.com'])
  },
}

export const Validated: Story = {
  args: {
    label: 'Serial numbers',
    placeholder: 'e.g. SN-10042',
    defaultValue: ['SN-10001', 'SN-10002'],
    validateTag: (t: string) => (/^SN-\d{5}$/.test(t) ? undefined : `${t} is not a serial number`),
    helpText: 'Paste a list from Excel to add many at once',
  },
}

export const MaxTags: Story = { args: { maxTags: 3, defaultValue: ['a@x.com', 'b@x.com'] } }

export const Disabled: Story = { args: { disabled: true, defaultValue: ['ap@acme.com'] } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: ['ap@acme.com', 'ar@acme.com'] } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { error: 'Add at least one recipient', required: true } }

export const Compact: Story = { args: { size: 'sm', defaultValue: ['ap@acme.com'] } }
