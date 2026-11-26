import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { AttachmentList } from './AttachmentList'
import { attachments, fakeUpload } from './AttachmentList.fixtures'

const meta = {
  title: 'Components/AttachmentList',
  component: AttachmentList,
  args: {
    attachments,
    upload: fakeUpload,
    onUploaded: fn(),
    onDownload: fn(),
    onPreview: fn(),
    onDelete: fn(),
    readOnly: false,
    accept: '.pdf,.xlsx,.docx,image/*',
    maxSize: 10 * 1024 * 1024,
  },
  argTypes: { attachments: { control: false }, upload: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AttachmentList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Delete PO-2026-0142.pdf' }))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
    await expect(args.onDelete).toHaveBeenCalled()
  },
}

export const ReadOnly: Story = { args: { readOnly: true } }

export const Empty: Story = { args: { attachments: [] } }

export const Disabled: Story = { args: { readOnly: true, onDelete: undefined, onPreview: undefined } }
