import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { must } from '../../test/must'
import { ImageUpload, type ImageValue } from './ImageUpload'

const photo = new File(['png'], 'pallet-rack.png', { type: 'image/png' })
const pdf = new File(['%PDF'], 'spec.pdf', { type: 'application/pdf' })
const big = new File([new Uint8Array(4096)], 'huge.png', { type: 'image/png' })
const stored: ImageValue = { url: 'https://files.example/logo.png', name: 'logo.png' }

const input = (container: HTMLElement) => must(container.querySelector<HTMLInputElement>('input[type="file"]'))

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
  })

  it('picks an image, previews it, then removes it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(
      <ImageUpload
        label='Item photo'
        onChange={onChange}
      />
    )
    expect(screen.getByRole('group', { name: 'Item photo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose image' })).toBeInTheDocument()

    await user.upload(input(container), photo)
    expect(onChange).toHaveBeenLastCalledWith({ url: 'blob:test', name: 'pallet-rack.png', file: photo })
    expect(screen.getByRole('img', { name: 'pallet-rack.png' })).toHaveAttribute('src', 'blob:test')
    expect(screen.getByRole('button', { name: 'Replace image' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(screen.queryByRole('img', { name: 'pallet-rack.png' })).not.toBeInTheDocument()
  })

  it('rejects files that are not images or are too large', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const onChange = vi.fn()
    const { container } = render(
      <ImageUpload
        label='Item photo'
        maxSize={1024}
        onChange={onChange}
      />
    )
    await user.upload(input(container), pdf)
    expect(screen.getByText('Choose an image file')).toBeInTheDocument()
    await user.upload(input(container), big)
    expect(screen.getByText('Image is larger than 1 KB')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()

    await user.upload(input(container), photo)
    expect(screen.queryByText('Image is larger than 1 KB')).not.toBeInTheDocument()
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('accepts an image dropped on the preview', () => {
    const onChange = vi.fn()
    const { container } = render(
      <ImageUpload
        label='Company logo'
        onChange={onChange}
      />
    )
    const preview = must(container.querySelector<HTMLElement>('.erp-image-upload__preview'))
    const dataTransfer = { files: [photo] }
    fireEvent.dragOver(preview, { dataTransfer })
    fireEvent.drop(preview, { dataTransfer })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'pallet-rack.png' }))
  })

  it('crops before saving: move with the keyboard, zoom, apply', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(
      <ImageUpload
        label='Company logo'
        cropAspect={1}
        onChange={onChange}
      />
    )
    await user.upload(input(container), photo)
    expect(onChange).not.toHaveBeenCalled()

    const dialog = screen.getByRole('dialog', { name: 'Crop image' })
    expect(dialog).toBeInTheDocument()
    const frame = screen.getByRole('application', { name: 'Image position' })
    const img = screen.getByRole('img', { name: 'Image to crop' })
    frame.focus()
    await user.keyboard('{ArrowRight}{ArrowDown}{Shift>}{ArrowLeft}{/Shift}')
    expect(img.style.transform).toBe('translate(-15px, 5px) scale(1)')

    fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), { target: { value: '2' } })
    expect(img.style.transform).toBe('translate(-15px, 5px) scale(2)')

    // jsdom has no canvas, so the original file is kept.
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onChange).toHaveBeenCalledWith({ url: 'blob:test', name: 'pallet-rack.png', file: photo })
    expect(screen.queryByRole('dialog', { name: 'Crop image' })).not.toBeInTheDocument()
  })

  it('cancelling the crop keeps the previous image and frees the object URL', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const { container } = render(
      <ImageUpload
        label='Company logo'
        cropAspect={4 / 3}
        defaultValue={stored}
        onChange={onChange}
      />
    )
    await user.upload(input(container), photo)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(revoke).toHaveBeenCalledWith('blob:test')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('img', { name: 'logo.png' })).toBeInTheDocument()
  })

  it('shows a stored image read-only without actions', () => {
    render(
      <ImageUpload
        label='Company logo'
        value={stored}
        readOnly
      />
    )
    expect(screen.getByRole('img', { name: 'logo.png' })).toHaveAttribute('src', stored.url)
    expect(screen.getByText('logo.png', { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Replace image' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
  })
})
