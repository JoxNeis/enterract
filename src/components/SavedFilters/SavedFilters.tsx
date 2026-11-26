import { useRef, useState } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { Dialog } from '../Dialog'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Popover } from '../Popover'
import { TextField } from '../TextField'
import './SavedFilters.css'

export interface SavedView<F = unknown> {
  id: string
  name: string
  /** The saved filter values. */
  filters: F
  favorite?: boolean
  /** Applied when the list opens. */
  isDefault?: boolean
  /** Shared by an admin; users can't delete it. */
  shared?: boolean
}

export interface SavedFiltersProps<F = unknown> {
  views: readonly SavedView<F>[]
  /** The applied view. */
  activeId: string | null
  onSelect: (view: SavedView<F>) => void
  /** The current filters differ from the active view (shows "modified"). */
  modified?: boolean
  /** Save the current filters as a new view. */
  onSave?: (input: { name: string; isDefault: boolean }) => void
  /** Overwrite the active view with the current filters. */
  onUpdate?: (id: string) => void
  onDelete?: (id: string) => void
  onToggleFavorite?: (id: string) => void
  onSetDefault?: (id: string) => void
  className?: string
}

/** Saved list views ("My open orders", "Overdue > 30 days") with favorites, default and save-as. */
export function SavedFilters<F = unknown>({
  views,
  activeId,
  onSelect,
  modified = false,
  onSave,
  onUpdate,
  onDelete,
  onToggleFavorite,
  onSetDefault,
  className,
}: SavedFiltersProps<F>) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState<string | null>(null)
  const [asDefault, setAsDefault] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const active = views.find((v) => v.id === activeId)
  const ordered = [...views].sort((a, b) => Number(b.favorite ?? false) - Number(a.favorite ?? false) || a.name.localeCompare(b.name))

  const save = () => {
    const trimmed = name?.trim() ?? ''
    if (!trimmed) {
      setNameError('Enter a name')
      return
    }
    if (views.some((v) => v.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('A view with this name already exists')
      return
    }
    onSave?.({ name: trimmed, isDefault: asDefault })
    setSaving(false)
    setName(null)
    setAsDefault(false)
  }

  return (
    <div className={cx('erp-saved-filters', className)}>
      <Button
        ref={triggerRef}
        size='sm'
        variant='ghost'
        icon={<Icon name={active?.favorite ? 'star' : 'list'} />}
        iconEnd={<Icon name='chevron-down' />}
        aria-haspopup='dialog'
        aria-expanded={open}
        onClick={() => {
          setOpen(!open)
        }}
      >
        <span className='erp-saved-filters__current'>
          {active?.name ?? 'Unsaved view'}
          {modified && <span className='erp-saved-filters__modified'> (modified)</span>}
        </span>
      </Button>
      {modified && active && onUpdate && !active.shared && (
        <Button
          size='sm'
          variant='ghost'
          onClick={() => {
            onUpdate(active.id)
          }}
        >
          Update view
        </Button>
      )}
      <Popover
        open={open}
        anchorRef={triggerRef}
        role='dialog'
        aria-label='Saved views'
        className='erp-saved-filters__popover'
        onClose={(reason) => {
          setOpen(false)
          if (reason === 'escape') triggerRef.current?.focus()
        }}
      >
        <ul className='erp-saved-filters__list'>
          {ordered.map((v) => (
            <li
              key={v.id}
              className='erp-saved-filters__item'
              data-active={flag(v.id === activeId)}
            >
              <button
                type='button'
                className='erp-saved-filters__select'
                aria-current={v.id === activeId ? 'true' : undefined}
                onClick={() => {
                  onSelect(v)
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
              >
                {v.name}
                {v.isDefault && <span className='erp-saved-filters__badge'>Default</span>}
                {v.shared && <span className='erp-saved-filters__badge'>Shared</span>}
              </button>
              {onToggleFavorite && (
                <IconButton
                  size='sm'
                  icon='star'
                  aria-label={v.favorite ? `Remove ${v.name} from favorites` : `Add ${v.name} to favorites`}
                  aria-pressed={Boolean(v.favorite)}
                  className='erp-saved-filters__star'
                  data-on={flag(v.favorite)}
                  tooltip={false}
                  onClick={() => {
                    onToggleFavorite(v.id)
                  }}
                />
              )}
              {onSetDefault && !v.isDefault && (
                <IconButton
                  size='sm'
                  icon='check'
                  aria-label={`Make ${v.name} the default view`}
                  tooltip={false}
                  onClick={() => {
                    onSetDefault(v.id)
                  }}
                />
              )}
              {onDelete && !v.shared && (
                <IconButton
                  size='sm'
                  icon='trash'
                  aria-label={`Delete ${v.name}`}
                  tooltip={false}
                  onClick={() => {
                    onDelete(v.id)
                  }}
                />
              )}
            </li>
          ))}
          {ordered.length === 0 && <li className='erp-empty'>No saved views yet</li>}
        </ul>
        {onSave && (
          <div className='erp-saved-filters__footer'>
            <Button
              size='sm'
              icon={<Icon name='save' />}
              onClick={() => {
                setOpen(false)
                setSaving(true)
              }}
            >
              Save current view…
            </Button>
          </div>
        )}
      </Popover>
      <Dialog
        open={saving}
        size='sm'
        title='Save view'
        onClose={() => {
          setSaving(false)
          setNameError(null)
        }}
        footer={
          <>
            <Button
              variant='ghost'
              onClick={() => {
                setSaving(false)
              }}
            >
              Cancel
            </Button>
            <Button
              variant='primary'
              onClick={save}
            >
              Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <TextField
            label='Name'
            required
            autoFocus
            value={name}
            error={nameError}
            onChange={(v) => {
              setName(v)
              setNameError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') save()
            }}
          />
          <Checkbox
            label='Open this view by default'
            value={asDefault}
            onChange={(v) => {
              setAsDefault(Boolean(v))
            }}
          />
        </div>
      </Dialog>
    </div>
  )
}
