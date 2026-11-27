import { useState, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { formatDateTime, initials } from '../../utils/format'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { IconButton } from '../IconButton'
import { useLocale } from '../LocaleProvider'
import { TextArea } from '../TextArea'
import '../../styles/base.css'
import './CommentsPanel.css'

export interface CommentAuthor {
  id: string
  name: string
  avatarUrl?: string
}

export interface Comment {
  id: string
  author: CommentAuthor
  /** ISO 8601 instant. */
  createdAt: string
  editedAt?: string
  text: string
  /** Visible to staff only, not on customer-facing documents. */
  internal?: boolean
}

export interface CommentsPanelProps extends Omit<ComponentProps<'section'>, 'title'> {
  comments: readonly Comment[]
  /** Lets the current user edit and delete their own comments. */
  currentUserId?: string
  /** Post a new comment. May return a promise; the button shows a spinner. */
  onAdd?: (text: string, options: { internal: boolean }) => void | Promise<void>
  onEdit?: (id: string, text: string) => void | Promise<void>
  onDelete?: (id: string) => void | Promise<void>
  /** No new comments (closed documents). Existing ones stay visible. */
  readOnly?: boolean
  /** Show an "Internal note" checkbox. */
  allowInternal?: boolean
  title?: ReactNode
  placeholder?: string
  /** Order of the list. */
  order?: 'oldest-first' | 'newest-first'
  emptyText?: ReactNode
}

/**
 * Discussion thread on a record. Also covers the ERP "comments / notes" field.
 * Ctrl+Enter posts.
 */
export function CommentsPanel({
  comments,
  currentUserId,
  onAdd,
  onEdit,
  onDelete,
  readOnly = false,
  allowInternal = false,
  title = 'Comments',
  placeholder = 'Write a comment…',
  order = 'oldest-first',
  emptyText = 'No comments yet',
  className,
  ...props
}: CommentsPanelProps) {
  const { locale, timeZone } = useLocale()
  const [draft, setDraft] = useState<string | null>(null)
  const [internal, setInternal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<{ id: string; text: string | null } | null>(null)

  const sorted = [...comments].sort((a, b) =>
    order === 'oldest-first' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)
  )

  const post = async () => {
    const text = draft?.trim()
    if (!text || !onAdd) return
    setBusy(true)
    try {
      await onAdd(text, { internal })
      setDraft(null)
      setInternal(false)
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async () => {
    const text = editing?.text?.trim()
    if (!editing || !text) return
    await onEdit?.(editing.id, text)
    setEditing(null)
  }

  return (
    <section
      className={cx('erp-comments-panel', className)}
      aria-label={typeof title === 'string' ? title : 'Comments'}
      {...props}
    >
      <h3 className='erp-comments-panel__title'>
        {title} <span className='erp-comments-panel__count'>({comments.length})</span>
      </h3>
      {sorted.length === 0 ? (
        <p className='erp-empty'>{emptyText}</p>
      ) : (
        <ol className='erp-comments-panel__list'>
          {sorted.map((c) => {
            const own = currentUserId !== undefined && c.author.id === currentUserId
            const isEditing = editing?.id === c.id
            return (
              <li
                key={c.id}
                className='erp-comments-panel__item'
                data-internal={flag(c.internal)}
              >
                <span
                  className='erp-comments-panel__avatar'
                  aria-hidden='true'
                >
                  {c.author.avatarUrl ? (
                    <img
                      src={c.author.avatarUrl}
                      alt=''
                    />
                  ) : (
                    initials(c.author.name)
                  )}
                </span>
                <article className='erp-comments-panel__body'>
                  <header className='erp-comments-panel__meta'>
                    <strong>{c.author.name}</strong>
                    <time dateTime={c.createdAt}>{formatDateTime(c.createdAt, locale, timeZone)}</time>
                    {c.editedAt && <span>(edited)</span>}
                    {c.internal && <span className='erp-comments-panel__internal'>Internal</span>}
                    {own && !readOnly && !isEditing && (
                      <span className='erp-comments-panel__actions'>
                        {onEdit && (
                          <IconButton
                            size='sm'
                            icon='edit'
                            aria-label='Edit comment'
                            onClick={() => {
                              setEditing({ id: c.id, text: c.text })
                            }}
                          />
                        )}
                        {onDelete && (
                          <IconButton
                            size='sm'
                            icon='trash'
                            aria-label='Delete comment'
                            onClick={() => {
                              void onDelete(c.id)
                            }}
                          />
                        )}
                      </span>
                    )}
                  </header>
                  {isEditing ? (
                    <div className='erp-comments-panel__edit'>
                      <TextArea
                        label='Edit comment'
                        hideLabel
                        autoGrow
                        rows={2}
                        value={editing.text}
                        onChange={(text) => {
                          setEditing({ id: c.id, text })
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) void saveEdit()
                          if (event.key === 'Escape') setEditing(null)
                        }}
                        autoFocus
                      />
                      <div className='erp-comments-panel__buttons'>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => {
                            setEditing(null)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size='sm'
                          variant='primary'
                          onClick={() => {
                            void saveEdit()
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className='erp-comments-panel__text'>{c.text}</p>
                  )}
                </article>
              </li>
            )
          })}
        </ol>
      )}
      {!readOnly && onAdd && (
        <div className='erp-comments-panel__composer'>
          <TextArea
            label='New comment'
            hideLabel
            placeholder={placeholder}
            autoGrow
            rows={2}
            value={draft}
            onChange={setDraft}
            helpText='Ctrl+Enter to post'
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                void post()
              }
            }}
          />
          <div className='erp-comments-panel__buttons'>
            {allowInternal && (
              <Checkbox
                label='Internal note'
                size='sm'
                value={internal}
                onChange={(v) => {
                  setInternal(Boolean(v))
                }}
              />
            )}
            <Button
              size='sm'
              variant='primary'
              loading={busy}
              disabled={!draft?.trim()}
              onClick={() => {
                void post()
              }}
            >
              Post
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
