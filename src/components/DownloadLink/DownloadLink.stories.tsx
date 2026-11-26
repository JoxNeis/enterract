import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { DownloadLink } from './DownloadLink'

const meta = {
  title: 'Components/DownloadLink',
  component: DownloadLink,
  args: { fileName: 'INV-2026-0142.pdf', href: '#', size: 182_400, onError: fn() },
} satisfies Meta<typeof DownloadLink>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link')).toHaveAttribute('download', 'INV-2026-0142.pdf')
  },
}

/** The file is produced on click (e.g. a report); a spinner shows meanwhile. */
export const Generated: Story = {
  args: {
    fileName: 'aging-report.csv',
    size: undefined,
    children: 'Download aging report',
    getFile: () =>
      new Promise<Blob>((resolve) => {
        setTimeout(() => {
          resolve(new Blob(['Customer,Overdue\nAcme,1200\n'], { type: 'text/csv' }))
        }, 800)
      }),
  },
}

export const Disabled: Story = { args: { href: undefined, 'aria-disabled': true } }
