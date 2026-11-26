import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { ImageUpload, type ImageUploadProps } from './ImageUpload'
import { companyLogo, productFile, productPhoto } from './ImageUpload.fixtures'

function Stateful(args: ImageUploadProps) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <ImageUpload
      {...args}
      value={value}
      onChange={(v) => {
        setValue(v)
        args.onChange?.(v)
      }}
    />
  )
}

const fileInput = (root: HTMLElement) => {
  const input = root.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('file input missing')
  return input
}

const meta = {
  title: 'Components/ImageUpload',
  component: ImageUpload,
  args: {
    label: 'Item photo',
    value: null,
    accept: 'image/*',
    maxSize: 2 * 1024 * 1024,
    previewSize: 128,
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
} satisfies Meta<typeof ImageUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.upload(fileInput(canvasElement), productFile())
    await waitFor(() => expect(args.onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'pallet-rack-PR-1200.svg' })))
    await expect(within(canvasElement).getByRole('button', { name: 'Replace image' })).toBeVisible()
  },
}

export const WithImage: Story = { args: { value: productPhoto, previewSize: 160 } }

/** Square crop for a company logo: drag or use the arrow keys, zoom with the slider or +/−. */
export const CropLogo: Story = {
  args: { label: 'Company logo', cropAspect: 1, outputWidth: 512, value: companyLogo },
  play: async ({ canvasElement }) => {
    await userEvent.upload(fileInput(canvasElement), productFile())
    const dialog = await screen.findByRole('dialog', { name: 'Crop image' })
    await expect(within(dialog).getByRole('slider', { name: 'Zoom' })).toBeVisible()
  },
}

/** 4:3 product photo crop. */
export const CropProductPhoto: Story = { args: { cropAspect: 4 / 3, previewSize: 160 } }

export const Disabled: Story = { args: { disabled: true, value: productPhoto } }

export const ReadOnly: Story = { args: { readOnly: true, value: companyLogo, label: 'Company logo' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Add a photo before publishing the item' } }

export const Compact: Story = { args: { size: 'sm', previewSize: 72 } }
