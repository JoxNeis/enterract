import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { fakeUpload } from '../AttachmentList/AttachmentList.fixtures'
import { FileUpload } from './FileUpload'

const meta = {
  title: 'Components/FileUpload',
  component: FileUpload,
  args: {
    label: 'Supporting documents',
    accept: '.pdf,.xlsx,image/*',
    maxSize: 5 * 1024 * 1024,
    multiple: true,
    dropzone: true,
    onFilesSelected: fn(),
    onRejected: fn(),
    onUploaded: fn(),
    disabled: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    upload: { control: false },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 520 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error('file input missing')
    await userEvent.upload(input, new File(['%PDF'], 'invoice.pdf', { type: 'application/pdf' }))
    await expect(args.onFilesSelected).toHaveBeenCalled()
  },
}

/** Fake upload with progress, cancel and retry. */
export const WithProgress: Story = { args: { upload: fakeUpload } }

export const ButtonOnly: Story = { args: { dropzone: false, label: 'Attachment', instructions: 'Attach file' } }

export const SingleFile: Story = { args: { multiple: false, accept: '.pdf', label: 'Signed contract (PDF)' } }

export const Disabled: Story = { args: { disabled: true } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { error: 'Upload the signed delivery note' } }

export const Compact: Story = {
  args: { size: 'sm' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Browse files' })).toBeVisible()
  },
}
