import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { formatBytes } from '../../utils/format'
import type { FieldProps } from '../../utils/types'
import { Button } from '../Button'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { fileMatchesAccept } from './accept'
import './FileUpload.css'

export type UploadStatus = 'uploading' | 'done' | 'error' | 'cancelled'

export interface UploadItem {
  id: string
  file: File
  status: UploadStatus
  /** 0–1 */
  progress: number
  error?: string
}

export interface FileRejection {
  file: File
  reason: 'type' | 'size' | 'count'
  message: string
}

export interface UploadContext {
  /** Report progress 0–1. */
  onProgress: (progress: number) => void
  /** Aborted when the user cancels. */
  signal: AbortSignal
}

export interface FileUploadProps extends Omit<FieldProps, 'name' | 'readOnly'> {
  /** Accepted types: extensions and MIME types, e.g. `.pdf,.xlsx,image/*`. */
  accept?: string
  /** Max file size in bytes. */
  maxSize?: number
  /** Max number of files per selection. */
  maxFiles?: number
  multiple?: boolean
  /** Uploads one file. When given, the component shows progress, cancel and retry. */
  upload?: (file: File, ctx: UploadContext) => Promise<unknown>
  /** Valid files the user picked or dropped (before upload). */
  onFilesSelected?: (files: File[]) => void
  /** A file finished uploading. */
  onUploaded?: (file: File, result: unknown) => void
  onRejected?: (rejections: FileRejection[]) => void
  /** Show the drag-and-drop area. `false` shows only a button. */
  dropzone?: boolean
  /** Text in the drop area. */
  instructions?: ReactNode
  /** Hide finished uploads from the list. */
  hideCompleted?: boolean
  name?: string
}

let uploadCounter = 0

/**
 * File picker with drag-and-drop, type and size checks, and per-file progress when an `upload`
 * function is given. Keyboard users use the Browse button; the drop area is a mouse shortcut.
 */
export function FileUpload(props: FileUploadProps) {
  const [field, rest] = useFieldProps(props)
  const {
    accept,
    maxSize,
    maxFiles,
    multiple = true,
    upload,
    onFilesSelected,
    onUploaded,
    onRejected,
    dropzone = true,
    instructions,
    hideCompleted = false,
    name,
  } = rest
  const { locale } = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const controllers = useRef(new Map<string, AbortController>())
  const [items, setItems] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [rejections, setRejections] = useState<FileRejection[]>([])
  const hintId = useId()

  const patch = (id: string, changes: Partial<UploadItem>) => {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...changes } : i)))
  }

  const start = (item: UploadItem) => {
    if (!upload) return
    const controller = new AbortController()
    controllers.current.set(item.id, controller)
    upload(item.file, {
      signal: controller.signal,
      onProgress: (p) => {
        patch(item.id, { progress: Math.max(0, Math.min(1, p)) })
      },
    })
      .then((result) => {
        if (controller.signal.aborted) return
        patch(item.id, { status: 'done', progress: 1 })
        onUploaded?.(item.file, result)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        patch(item.id, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' })
      })
      .finally(() => {
        controllers.current.delete(item.id)
      })
  }

  const accept_ = (files: File[]) => {
    if (field.disabled) return
    const rejected: FileRejection[] = []
    const valid: File[] = []
    for (const file of files) {
      if (!fileMatchesAccept(file, accept)) rejected.push({ file, reason: 'type', message: `${file.name}: file type not allowed` })
      else if (maxSize !== undefined && file.size > maxSize)
        rejected.push({ file, reason: 'size', message: `${file.name}: larger than ${formatBytes(maxSize, locale)}` })
      else valid.push(file)
    }
    const limit = multiple ? (maxFiles ?? Number.POSITIVE_INFINITY) : 1
    for (const file of valid.splice(limit)) rejected.push({ file, reason: 'count', message: `${file.name}: too many files` })
    setRejections(rejected)
    if (rejected.length) onRejected?.(rejected)
    if (!valid.length) return
    onFilesSelected?.(valid)
    if (upload) {
      const created = valid.map<UploadItem>((file) => ({
        id: `upload-${String(++uploadCounter)}`,
        file,
        status: 'uploading',
        progress: 0,
      }))
      setItems((list) => [...list, ...created])
      created.forEach(start)
    }
  }

  const cancel = (item: UploadItem) => {
    controllers.current.get(item.id)?.abort()
    patch(item.id, { status: 'cancelled' })
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    accept_(Array.from(event.dataTransfer.files))
  }

  const shown = hideCompleted ? items.filter((i) => i.status !== 'done') : items
  const limits = [
    accept && `Allowed: ${accept.replace(/,/g, ', ')}`,
    maxSize !== undefined && `Max ${formatBytes(maxSize, locale)}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <FormField
      {...field}
      group
      error={field.error ?? (rejections.length ? rejections.map((r) => r.message).join('; ') : undefined)}
      helpText={field.helpText ?? (limits || undefined)}
      className={cx('erp-file-upload', field.className)}
    >
      {(f) => (
        <div
          className='erp-file-upload__body'
          role='group'
          aria-labelledby={field.label != null ? f.labelId : undefined}
          aria-describedby={f.describedBy}
        >
          <input
            ref={inputRef}
            id={f.id}
            type='file'
            name={name}
            className='erp-visually-hidden'
            tabIndex={-1}
            accept={accept}
            multiple={multiple}
            disabled={field.disabled}
            aria-hidden='true'
            onChange={(event) => {
              accept_(Array.from(event.target.files ?? []))
              event.target.value = ''
            }}
          />
          {dropzone ? (
            <div
              className='erp-file-upload__dropzone'
              data-dragging={flag(dragging)}
              data-disabled={flag(field.disabled)}
              data-invalid={flag(f.invalid)}
              data-size={field.size}
              onDragOver={(event) => {
                event.preventDefault()
                if (!field.disabled) setDragging(true)
              }}
              onDragLeave={() => {
                setDragging(false)
              }}
              onDrop={onDrop}
            >
              <Icon
                name='upload'
                className='erp-file-upload__icon'
              />
              <span id={hintId}>{instructions ?? 'Drag files here or'}</span>
              <Button
                size='sm'
                disabled={field.disabled}
                aria-describedby={hintId}
                onClick={() => inputRef.current?.click()}
              >
                Browse files
              </Button>
            </div>
          ) : (
            <Button
              size={field.size}
              icon={<Icon name='paperclip' />}
              disabled={field.disabled}
              onClick={() => inputRef.current?.click()}
            >
              {instructions ?? 'Attach files'}
            </Button>
          )}
          {shown.length > 0 && (
            <ul
              className='erp-file-upload__list'
              aria-label='Uploads'
            >
              {shown.map((item) => (
                <li
                  key={item.id}
                  className='erp-file-upload__item'
                  data-status={item.status}
                >
                  <Icon name='file' />
                  <span className='erp-file-upload__name'>{item.file.name}</span>
                  <span className='erp-file-upload__size'>{formatBytes(item.file.size, locale)}</span>
                  {item.status === 'uploading' && (
                    <progress
                      className='erp-file-upload__progress'
                      value={item.progress}
                      max={1}
                      aria-label={`Uploading ${item.file.name}`}
                    />
                  )}
                  <span className='erp-file-upload__state'>
                    {item.status === 'done' && (
                      <>
                        <Icon name='success' /> Uploaded
                      </>
                    )}
                    {item.status === 'error' && (
                      <>
                        <Icon name='error' /> {item.error}
                      </>
                    )}
                    {item.status === 'cancelled' && 'Cancelled'}
                  </span>
                  {item.status === 'uploading' && (
                    <button
                      type='button'
                      className='erp-input-action'
                      aria-label={`Cancel ${item.file.name}`}
                      onClick={() => {
                        cancel(item)
                      }}
                    >
                      <Icon name='close' />
                    </button>
                  )}
                  {item.status === 'error' && (
                    <button
                      type='button'
                      className='erp-input-action'
                      aria-label={`Retry ${item.file.name}`}
                      onClick={() => {
                        const retry = { ...item, status: 'uploading' as const, progress: 0, error: undefined }
                        patch(item.id, retry)
                        start(retry)
                      }}
                    >
                      <Icon name='refresh' />
                    </button>
                  )}
                  {(item.status === 'done' || item.status === 'cancelled' || item.status === 'error') && (
                    <button
                      type='button'
                      className='erp-input-action'
                      aria-label={`Remove ${item.file.name} from list`}
                      onClick={() => {
                        setItems((list) => list.filter((i) => i.id !== item.id))
                      }}
                    >
                      <Icon name='trash' />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </FormField>
  )
}
