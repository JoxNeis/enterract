import { useState, type ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { formatNumber } from '../../utils/number'
import { useControllableState } from '../../utils/useControllableState'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { useLocale } from '../LocaleProvider'
import '../../styles/base.css'
import './DocumentPreview.css'

export interface PreviewFile {
  name: string
  url: string
  /** MIME type; guessed from the file name when omitted. */
  type?: string
}

export interface DocumentPreviewProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  files: readonly PreviewFile[]
  /** Index of the shown file. */
  index?: number
  defaultIndex?: number
  onIndexChange?: (index: number) => void
  /** Height of the viewer (CSS length). */
  height?: string
}

function kindOf(file: PreviewFile): 'pdf' | 'image' | 'other' {
  const type = file.type ?? ''
  if (type === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'pdf'
  if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(file.name)) return 'image'
  return 'other'
}

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]

/** Viewer for PDFs and images with zoom, rotate and paging through several files. */
export function DocumentPreview({ files, index, defaultIndex = 0, onIndexChange, height = '28rem', className, ...props }: DocumentPreviewProps) {
  const { locale } = useLocale()
  const [current, setCurrent] = useControllableState({
    value: index,
    defaultValue: defaultIndex,
    onChange: onIndexChange
      ? (i) => {
          onIndexChange(i)
        }
      : undefined,
  })
  const [zoom, setZoom] = useState(2)
  const [rotation, setRotation] = useState(0)
  const file = files[Math.min(current, files.length - 1)]
  const kind = file ? kindOf(file) : 'other'
  const scale = ZOOMS[zoom] ?? 1

  const go = (i: number) => {
    setCurrent(i)
    setZoom(2)
    setRotation(0)
  }

  return (
    <div
      className={cx('erp-document-preview', className)}
      role='region'
      aria-label={file ? `Preview of ${file.name}` : 'Document preview'}
      {...props}
    >
      <div
        className='erp-document-preview__toolbar'
        role='toolbar'
        aria-label='Preview controls'
      >
        {files.length > 1 && (
          <>
            <IconButton
              size='sm'
              icon='chevron-left'
              aria-label='Previous file'
              disabled={current <= 0}
              onClick={() => {
                go(current - 1)
              }}
            />
            <span className='erp-document-preview__counter'>
              {current + 1} / {files.length}
            </span>
            <IconButton
              size='sm'
              icon='chevron-right'
              aria-label='Next file'
              disabled={current >= files.length - 1}
              onClick={() => {
                go(current + 1)
              }}
            />
          </>
        )}
        <span className='erp-document-preview__name'>{file?.name}</span>
        {kind === 'image' && (
          <>
            <IconButton
              size='sm'
              icon='minus'
              aria-label='Zoom out'
              disabled={zoom === 0}
              onClick={() => {
                setZoom(zoom - 1)
              }}
            />
            <span
              className='erp-document-preview__zoom'
              aria-live='polite'
            >
              {formatNumber(scale * 100, locale)}%
            </span>
            <IconButton
              size='sm'
              icon='add'
              aria-label='Zoom in'
              disabled={zoom === ZOOMS.length - 1}
              onClick={() => {
                setZoom(zoom + 1)
              }}
            />
            <IconButton
              size='sm'
              icon='refresh'
              aria-label='Rotate 90°'
              onClick={() => {
                setRotation((rotation + 90) % 360)
              }}
            />
          </>
        )}
        {file && (
          <>
            <a
              className='erp-document-preview__action'
              href={file.url}
              download={file.name}
              aria-label={`Download ${file.name}`}
            >
              <Icon name='download' />
            </a>
            <a
              className='erp-document-preview__action'
              href={file.url}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={`Open ${file.name} in a new tab`}
            >
              <Icon name='external' />
            </a>
          </>
        )}
      </div>
      <div
        className='erp-document-preview__view'
        style={{ height }}
      >
        {!file && <p className='erp-empty'>Nothing to preview</p>}
        {file && kind === 'pdf' && (
          <iframe
            title={file.name}
            src={file.url}
            className='erp-document-preview__frame'
          />
        )}
        {file && kind === 'image' && (
          <img
            src={file.url}
            alt={file.name}
            className='erp-document-preview__image'
            style={{ transform: `scale(${String(scale)}) rotate(${String(rotation)}deg)` }}
          />
        )}
        {file && kind === 'other' && (
          <div className='erp-document-preview__unsupported'>
            <Icon
              name='file'
              size={40}
            />
            <p>No preview for this file type.</p>
            <a
              href={file.url}
              download={file.name}
            >
              Download {file.name}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
