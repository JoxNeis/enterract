import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { fileMatchesAccept } from './accept'
import { FileUpload } from './FileUpload'
import { must } from '../../test/must'

const pdf = new File(['%PDF'], 'invoice.pdf', { type: 'application/pdf' })
const png = new File(['png'], 'scan.png', { type: 'image/png' })
const big = new File([new Uint8Array(2048)], 'big.pdf', { type: 'application/pdf' })

const input = (container: HTMLElement) => must(container.querySelector<HTMLInputElement>('input[type="file"]'))

describe('fileMatchesAccept', () => {
  it('matches extensions, exact types and wildcards', () => {
    expect(fileMatchesAccept(pdf, '.pdf')).toBe(true)
    expect(fileMatchesAccept(png, 'image/*')).toBe(true)
    expect(fileMatchesAccept(png, '.pdf,application/pdf')).toBe(false)
    expect(fileMatchesAccept(png)).toBe(true)
  })
})

describe('FileUpload', () => {
  it('passes valid files and rejects wrong type and size', async () => {
    const onFilesSelected = vi.fn()
    const onRejected = vi.fn()
    const { container } = render(
      <FileUpload
        label='Invoice scan'
        accept='.pdf'
        maxSize={1024}
        onFilesSelected={onFilesSelected}
        onRejected={onRejected}
        className='extra'
      />
    )

    expect(screen.getByRole('group', { name: 'Invoice scan' })).toBeInTheDocument()
    await userEvent.upload(input(container), [pdf, big], { applyAccept: false })
    expect(onFilesSelected).toHaveBeenCalledWith([pdf])
    expect(onRejected).toHaveBeenCalledWith([expect.objectContaining({ file: big, reason: 'size' })])
    expect(screen.getByText(/big\.pdf: larger than 1 KB/)).toBeInTheDocument()
    expect(container.querySelector('.erp-form-field')).toHaveClass('erp-file-upload', 'extra')
  })

  it('uploads with progress and reports completion', async () => {
    let finish: () => void = () => undefined
    const upload = vi.fn((_file: File, ctx: { onProgress: (p: number) => void }) => {
      ctx.onProgress(0.5)
      return new Promise<void>((resolve) => {
        finish = resolve
      })
    })
    const onUploaded = vi.fn()
    const { container } = render(
      <FileUpload
        label='Files'
        upload={upload}
        onUploaded={onUploaded}
      />
    )

    await userEvent.upload(input(container), pdf)
    expect(screen.getByRole('progressbar', { name: 'Uploading invoice.pdf' })).toHaveAttribute('value', '0.5')
    finish()
    await waitFor(() => {
      expect(screen.getByText('Uploaded')).toBeInTheDocument()
    })
    expect(onUploaded).toHaveBeenCalledWith(pdf, undefined)
  })

  it('accepts dropped files and the Browse button opens the picker', async () => {
    const onFilesSelected = vi.fn()
    const { container } = render(
      <FileUpload
        label='Files'
        onFilesSelected={onFilesSelected}
      />
    )
    const zone = must(container.querySelector('.erp-file-upload__dropzone'))
    const drop = Object.assign(new Event('drop', { bubbles: true, cancelable: true }), {
      dataTransfer: { files: [png] },
    })
    zone.dispatchEvent(drop)
    await waitFor(() => {
      expect(onFilesSelected).toHaveBeenCalledWith([png])
    })
    const click = vi.spyOn(input(container), 'click')
    await userEvent.click(screen.getByRole('button', { name: 'Browse files' }))
    expect(click).toHaveBeenCalled()
  })

  it('is disabled', () => {
    render(
      <FileUpload
        label='Files'
        disabled
      />
    )
    expect(screen.getByRole('button', { name: 'Browse files' })).toBeDisabled()
  })
})
