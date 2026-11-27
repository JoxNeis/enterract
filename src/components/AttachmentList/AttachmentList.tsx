import { useState, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { formatBytes, formatDateTime } from '../../utils/format'
import { ConfirmDialog } from '../ConfirmDialog'
import { FileUpload, type FileUploadProps } from '../FileUpload'
import { Icon, type IconName } from '../Icon'
import { IconButton } from '../IconButton'
import { useLocale } from '../LocaleProvider'
import '../../styles/base.css'
import './AttachmentList.css'

export interface Attachment {
  id: string
  name: string
  /** Bytes. */
  size?: number
  /** MIME type. */
  type?: string
  /** ISO 8601 instant. */
  uploadedAt?: string
  uploadedBy?: string
  /** Download URL. Used when `onDownload` is not given. */
  url?: string
}

export interface AttachmentListProps extends Omit<ComponentProps<'section'>, 'title'> {
  attachments: readonly Attachment[]
  title?: ReactNode
  /** Uploads one file (with progress). Shows the upload area when given. */
  upload?: FileUploadProps['upload']
  /** Called after a file was uploaded (refresh your list here). */
  onUploaded?: FileUploadProps['onUploaded']
  /** Alternative to `upload`: receive the picked files and handle them yourself. */
  onFilesSelected?: (files: File[]) => void
  onDownload?: (attachment: Attachment) => void
  onPreview?: (attachment: Attachment) => void
  /** Shows a delete button (with confirmation). */
  onDelete?: (attachment: Attachment) => void | Promise<void>
  /** No upload or delete (posted documents). */
  readOnly?: boolean
  accept?: string
  maxSize?: number
  emptyText?: ReactNode
}

function iconFor(type?: string, name = ''): IconName {
  if (type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return 'image'
  return 'file'
}

/** Files attached to a record, with upload, download, preview and delete. */
export function AttachmentList({
  attachments,
  title = 'Attachments',
  upload,
  onUploaded,
  onFilesSelected,
  onDownload,
  onPreview,
  onDelete,
  readOnly = false,
  accept,
  maxSize,
  emptyText = 'No files attached',
  className,
  ...props
}: AttachmentListProps) {
  const { locale, timeZone } = useLocale()
  const [toDelete, setToDelete] = useState<Attachment | null>(null)
  const canUpload = !readOnly && (upload !== undefined || onFilesSelected !== undefined)

  return (
    <section
      className={cx('erp-attachment-list', className)}
      aria-label={typeof title === 'string' ? title : 'Attachments'}
      {...props}
    >
      <div className='erp-attachment-list__header'>
        <h3 className='erp-attachment-list__title'>
          {title} <span className='erp-attachment-list__count'>({attachments.length})</span>
        </h3>
      </div>
      {attachments.length === 0 ? (
        <p className='erp-empty'>{emptyText}</p>
      ) : (
        <ul className='erp-attachment-list__items'>
          {attachments.map((a) => (
            <li
              key={a.id}
              className='erp-attachment-list__item'
            >
              <Icon
                name={iconFor(a.type, a.name)}
                className='erp-attachment-list__icon'
              />
              <div className='erp-attachment-list__info'>
                {a.url && !onDownload ? (
                  <a
                    href={a.url}
                    download={a.name}
                    className='erp-attachment-list__name'
                  >
                    {a.name}
                  </a>
                ) : (
                  <span className='erp-attachment-list__name'>{a.name}</span>
                )}
                <span className='erp-attachment-list__meta'>
                  {[
                    a.size !== undefined && formatBytes(a.size, locale),
                    a.uploadedBy,
                    a.uploadedAt && formatDateTime(a.uploadedAt, locale, timeZone),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <div className='erp-attachment-list__actions'>
                {onPreview && (
                  <IconButton
                    size='sm'
                    icon='eye'
                    aria-label={`Preview ${a.name}`}
                    onClick={() => {
                      onPreview(a)
                    }}
                  />
                )}
                {(onDownload ?? a.url) && (
                  <IconButton
                    size='sm'
                    icon='download'
                    aria-label={`Download ${a.name}`}
                    onClick={() => {
                      if (onDownload) onDownload(a)
                      else if (a.url) window.open(a.url, '_blank', 'noopener')
                    }}
                  />
                )}
                {onDelete && !readOnly && (
                  <IconButton
                    size='sm'
                    icon='trash'
                    aria-label={`Delete ${a.name}`}
                    onClick={() => {
                      setToDelete(a)
                    }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {canUpload && (
        <FileUpload
          label='Add files'
          hideLabel
          size='sm'
          accept={accept}
          maxSize={maxSize}
          upload={upload}
          onUploaded={onUploaded}
          onFilesSelected={onFilesSelected}
          hideCompleted
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title={`Delete ${toDelete?.name ?? 'file'}?`}
        message='The file is removed from this record.'
        confirmLabel='Delete'
        tone='danger'
        onCancel={() => {
          setToDelete(null)
        }}
        onConfirm={async () => {
          if (toDelete) await onDelete?.(toDelete)
          setToDelete(null)
        }}
      />
    </section>
  )
}
