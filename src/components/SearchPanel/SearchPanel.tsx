import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import type { Option } from '../../utils/types'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { SearchField } from '../SearchField'
import { Select } from '../Select'
import './SearchPanel.css'

export interface SearchRequest {
  text: string
  /** Selected scope key, or null for all fields. */
  scope: string | null
}

export interface SearchPanelProps extends Omit<ComponentProps<'search'>, 'onSubmit'> {
  /** Runs on Enter, after typing stops (`debounce`), and on clear. */
  onSearch: (request: SearchRequest) => void
  /** Restrict the search to one field ("Customer", "Order no."…). */
  scopes?: readonly Option[]
  placeholder?: string
  debounce?: number
  /** Advanced filters shown under the search when expanded (e.g. a FilterPanel). */
  advanced?: ReactNode
  defaultAdvancedOpen?: boolean
  /** Number of active advanced filters, shown on the toggle. */
  activeFilterCount?: number
  loading?: boolean
}

/** Search box for a list: text, optional field scope, and an expandable area for advanced filters. */
export function SearchPanel({
  onSearch,
  scopes,
  placeholder = 'Search…',
  debounce = 300,
  advanced,
  defaultAdvancedOpen = false,
  activeFilterCount = 0,
  loading = false,
  className,
  ...props
}: SearchPanelProps) {
  const [text, setText] = useState('')
  const [scope, setScope] = useState<string | null>(null)
  const [open, setOpen] = useState(defaultAdvancedOpen)
  const id = useId()

  return (
    <search
      role='search'
      className={cx('erp-search-panel', className)}
      {...props}
    >
      <div className='erp-search-panel__bar'>
        {scopes && scopes.length > 0 && (
          <Select
            aria-label='Search in'
            size='sm'
            className='erp-search-panel__scope'
            placeholder='All fields'
            clearable
            options={scopes}
            value={scope}
            onChange={(next) => {
              setScope(next)
              if (text) onSearch({ text, scope: next })
            }}
          />
        )}
        <SearchField
          aria-label='Search'
          size='sm'
          className='erp-search-panel__field'
          placeholder={placeholder}
          debounce={debounce}
          loading={loading}
          value={text || null}
          onChange={(v) => {
            setText(v ?? '')
          }}
          onSearch={(t) => {
            onSearch({ text: t, scope })
          }}
        />
        {advanced && (
          <Button
            size='sm'
            variant={open ? 'secondary' : 'ghost'}
            icon={<Icon name='filter' />}
            aria-expanded={open}
            aria-controls={`${id}-advanced`}
            onClick={() => {
              setOpen(!open)
            }}
          >
            Filters
            {activeFilterCount > 0 && <span className='erp-search-panel__count'>{activeFilterCount}</span>}
          </Button>
        )}
      </div>
      {advanced && (
        <div
          id={`${id}-advanced`}
          className='erp-search-panel__advanced'
          hidden={!open}
        >
          {advanced}
        </div>
      )}
    </search>
  )
}
