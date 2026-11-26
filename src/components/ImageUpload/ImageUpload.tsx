import { useRef, useState, type KeyboardEvent } from 'react'
import { cx } from '../../utils/cx'
import { formatBytes } from '../../utils/format'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { Button } from '../Button'
import { Dialog } from '../Dialog'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import './ImageUpload.css'

export interface ImageValue {
  /** Display URL (object URL for new files, or your stored image URL). */
  url: string
  name: string
  /** The (cropped) file to upload. Absent for an existing stored image. */
  file?: File
}

export interface ImageUploadProps extends Omit<FieldProps, 'name'> {
  value?: ImageValue | null
  defaultValue?: ImageValue | null
  onChange?: (value: ImageValue | null) => void
  accept?: string
  maxSize?: number
  /** Width ÷ height of the crop frame (1 = square logo, 4/3 = product photo). Omit to skip cropping. */
  cropAspect?: number
  /** Output width of the cropped image in px. */
  outputWidth?: number
  /** Preview box size in px. */
  previewSize?: number
}

/**
 * Single image (item photo, company logo, avatar) with preview, replace, remove and an optional
 * crop step: zoom with the slider, move with the arrow keys or by dragging.
 */
export function ImageUpload(props: ImageUploadProps) {
  const [field, rest] = useFieldProps(props)
  const { value, defaultValue = null, onChange, accept = 'image/*', maxSize, cropAspect, outputWidth = 800, previewSize = 128 } = rest
  const { locale } = useLocale()
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange: onChange ? (v) => { onChange(v) } : undefined })
  const [error, setError] = useState<string | null>(null)
  const [cropping, setCropping] = useState<{ file: File; url: string } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const editable = !field.disabled && !field.readOnly

  const cancelCrop = () => {
    if (cropping) URL.revokeObjectURL(cropping.url)
    setCropping(null)
  }

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file')
      return
    }
    if (maxSize !== undefined && file.size > maxSize) {
      setError(`Image is larger than ${formatBytes(maxSize, locale)}`)
      return
    }
    setError(null)
    const url = URL.createObjectURL(file)
    if (cropAspect) {
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      setCropping({ file, url })
    } else {
      setCurrent({ url, name: file.name, file })
    }
  }

  const applyCrop = () => {
    if (!cropping) return
    const img = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!img || !ctx || !cropAspect || !img.naturalWidth) {
      setCurrent({ url: cropping.url, name: cropping.file.name, file: cropping.file })
      setCropping(null)
      return
    }
    const frameW = 320
    const frameH = frameW / cropAspect
    const base = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight)
    const s = base * zoom
    const sx = (img.naturalWidth * s - frameW) / 2 - offset.x
    const sy = (img.naturalHeight * s - frameH) / 2 - offset.y
    canvas.width = outputWidth
    canvas.height = Math.round(outputWidth / cropAspect)
    ctx.drawImage(img, sx / s, sy / s, frameW / s, frameH / s, 0, 0, canvas.width, canvas.height)
    const { file } = cropping
    canvas.toBlob((blob) => {
      const out = blob ? new File([blob], file.name.replace(/\.\w+$/, '.png'), { type: 'image/png' }) : file
      setCurrent({ url: URL.createObjectURL(out), name: out.name, file: out })
    }, 'image/png')
    setCropping(null)
  }

  const onCropKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 20 : 5
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const m = moves[event.key]
    if (m) {
      event.preventDefault()
      setOffset((o) => ({ x: o.x + m[0], y: o.y + m[1] }))
    } else if (event.key === '+' || event.key === '=') setZoom((z) => Math.min(4, z + 0.1))
    else if (event.key === '-') setZoom((z) => Math.max(1, z - 0.1))
  }

  return (
    <FormField
      {...field}
      group
      error={field.error ?? error}
      className={cx('erp-image-upload', field.className)}
    >
      {(f) => (
        <div
          role='group'
          id={f.id}
          aria-labelledby={field.label != null ? f.labelId : undefined}
          aria-describedby={f.describedBy}
          className='erp-image-upload__body'
        >
          <div
            className='erp-image-upload__preview'
            style={{ width: previewSize, height: cropAspect ? previewSize / cropAspect : previewSize }}
            data-empty={current ? undefined : true}
            onDragOver={(event) => {
              if (editable) event.preventDefault()
            }}
            onDrop={(event) => {
              event.preventDefault()
              if (editable) pick(event.dataTransfer.files[0])
            }}
          >
            {current ? (
              <img
                src={current.url}
                alt={current.name}
              />
            ) : (
              <Icon
                name='image'
                size={32}
              />
            )}
          </div>
          <div className='erp-image-upload__actions'>
            <input
              ref={inputRef}
              type='file'
              accept={accept}
              className='erp-visually-hidden'
              tabIndex={-1}
              aria-hidden='true'
              disabled={!editable}
              onChange={(event) => {
                pick(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            {editable && (
              <Button
                size='sm'
                icon={<Icon name='upload' />}
                onClick={() => inputRef.current?.click()}
              >
                {current ? 'Replace image' : 'Choose image'}
              </Button>
            )}
            {editable && current && (
              <Button
                size='sm'
                variant='ghost'
                icon={<Icon name='trash' />}
                onClick={() => {
                  setCurrent(null)
                }}
              >
                Remove
              </Button>
            )}
            {current && <span className='erp-image-upload__name'>{current.name}</span>}
          </div>
          <Dialog
            open={cropping !== null}
            title='Crop image'
            description='Drag or use the arrow keys to position the image. Use the slider or +/− to zoom.'
            onClose={cancelCrop}
            footer={
              <>
                <Button
                  variant='ghost'
                  onClick={cancelCrop}
                >
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  onClick={applyCrop}
                >
                  Apply
                </Button>
              </>
            }
          >
            {cropping && cropAspect && (
              <div className='erp-image-upload__cropper'>
                <div
                  className='erp-image-upload__frame'
                  style={{ width: 320, height: 320 / cropAspect }}
                  tabIndex={0}
                  role='application'
                  aria-label='Image position'
                  onKeyDown={onCropKey}
                  onPointerDown={(event) => {
                    drag.current = { x: event.clientX - offset.x, y: event.clientY - offset.y }
                    try {
                event.currentTarget.setPointerCapture(event.pointerId)
              } catch {
                // Synthetic pointers (scripts, tests) cannot be captured; drawing still works.
              }
                  }}
                  onPointerMove={(event) => {
                    if (drag.current) setOffset({ x: event.clientX - drag.current.x, y: event.clientY - drag.current.y })
                  }}
                  onPointerUp={() => {
                    drag.current = null
                  }}
                >
                  <img
                    ref={imgRef}
                    src={cropping.url}
                    alt='Image to crop'
                    draggable={false}
                    style={{ transform: `translate(${String(offset.x)}px, ${String(offset.y)}px) scale(${String(zoom)})` }}
                  />
                </div>
                <label className='erp-image-upload__zoom'>
                  Zoom
                  <input
                    type='range'
                    min={1}
                    max={4}
                    step={0.05}
                    value={zoom}
                    onChange={(event) => {
                      setZoom(Number(event.target.value))
                    }}
                  />
                </label>
              </div>
            )}
          </Dialog>
        </div>
      )}
    </FormField>
  )
}
