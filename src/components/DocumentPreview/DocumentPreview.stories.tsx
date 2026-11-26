import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { DocumentPreview } from './DocumentPreview'
import { deliveryNote, invoiceScan, purchaseOrderPdf, spreadsheet } from './DocumentPreview.fixtures'

const poPdf = purchaseOrderPdf()

const meta = {
  title: 'Components/DocumentPreview',
  component: DocumentPreview,
  args: {
    files: [invoiceScan, poPdf, deliveryNote, spreadsheet],
    height: '28rem',
    onIndexChange: fn(),
  },
  argTypes: { files: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DocumentPreview>

export default meta
type Story = StoryObj<typeof meta>

/** Several attachments: page with the arrows; images can be zoomed and rotated. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom in' }))
    await expect(canvas.getByText('125%')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Next file' }))
    await expect(args.onIndexChange).toHaveBeenCalledWith(1)
    await expect(canvas.getByText('2 / 4')).toBeVisible()
  },
}

export const SingleImage: Story = { args: { files: [invoiceScan] } }

export const Pdf: Story = { args: { files: [poPdf] } }

export const UnsupportedType: Story = { args: { files: [spreadsheet], height: '14rem' } }

export const Empty: Story = { args: { files: [], height: '10rem' } }

export const Compact: Story = { args: { files: [deliveryNote], height: '18rem' } }
