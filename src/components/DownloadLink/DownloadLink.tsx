import { useState, type ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { formatBytes } from '../../utils/format'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { Spinner } from '../Spinner'
import '../Link/Link.css'
import './DownloadLink.css'

export interface DownloadLinkProps extends Omit<ComponentProps<'a'>, 'onClick'> {
  /** File name for the browser's save dialog. */
  fileName: string
  /** File size in bytes, shown after the name. */
  size?: number
  /** Produce the file on demand (e.g. a generated report) instead of following `href`. */
  getFile?: () => Promise<Blob>
  /** Called when `getFile` fails. */
  onError?: (error: unknown) => void
}

/** Link to a file: a static `href`, or a file generated on click with `getFile`. */
export function DownloadLink({ fileName, size, getFile, onError, href, className, children, ...props }: DownloadLinkProps) {
  const { locale } = useLocale()
  const [busy, setBusy] = useState(false)

  const download = async () => {
    if (!getFile || busy) return
    setBusy(true)
    try {
      const blob = await getFile()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      onError?.(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <a
      className={cx('erp-link', 'erp-download-link', className)}
      href={getFile ? '#' : href}
      download={getFile ? undefined : fileName}
      aria-busy={flag(busy)}
      onClick={(event) => {
        if (!getFile) return
        event.preventDefault()
        void download()
      }}
      {...props}
    >
      {busy ? (
        <Spinner
          size='sm'
          label={null}
        />
      ) : (
        <Icon name='download' />
      )}
      <span>{children ?? fileName}</span>
      {size !== undefined && <span className='erp-download-link__size'>({formatBytes(size, locale)})</span>}
    </a>
  )
}
