import { useState, type ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { initials } from '../../utils/format'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { IconButton } from '../IconButton'
import { Lookup, type LookupColumn, type LookupDataSource } from '../Lookup'
import '../../styles/base.css'
import './ApproverPicker.css'

/** Minimum shape of a person who can approve. Your records may have more fields. */
export interface Approver {
  id: string
  name: string
  department?: string
  title?: string
  avatarUrl?: string
}

/** Avatar (photo or initials), name and department: the search results of the approver lookup. */
function approverColumns<T extends Approver>(): LookupColumn<T>[] {
  return [
    {
      key: 'avatar',
      header: '',
      width: '2rem',
      render: (e) => (
        <span
          className='erp-approver-picker__avatar'
          aria-hidden='true'
        >
          {e.avatarUrl ? (
            <img
              src={e.avatarUrl}
              alt=''
            />
          ) : (
            initials(e.name)
          )}
        </span>
      ),
    },
    { key: 'name', header: 'Name', width: '2fr' },
    { key: 'department', header: 'Department', width: '1fr' },
  ]
}

export interface ApproverPickerProps<T extends Approver = Approver>
  extends Omit<FieldProps, 'name'>, Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | keyof FieldProps> {
  dataSource: LookupDataSource<T>
  /** Ids of the approvers, in approval order. */
  value?: readonly string[] | null
  defaultValue?: readonly string[] | null
  onChange?: (ids: string[]) => void
  maxApprovers?: number
  /** Number the approvers (sequential approval) instead of a parallel list. */
  sequential?: boolean
  /** People who may not approve (e.g. the requester). */
  excludeIds?: readonly string[]
}

/** Choose who approves a document, in order. Search with a `Lookup` over your people `dataSource`. */
export function ApproverPicker<T extends Approver = Approver>(props: ApproverPickerProps<T>) {
  const [field, rest] = useFieldProps(props)
  const { dataSource, value, defaultValue = [], onChange, maxApprovers, sequential = true, excludeIds = [], ...native } = rest
  const [raw, setRaw] = useControllableState<readonly string[] | null>({
    value,
    defaultValue,
    onChange: onChange ? (v) => { onChange([...(v ?? [])]) } : undefined,
  })
  const ids = raw ?? []
  const [known, setKnown] = useState<Record<string, T>>({})
  const [error, setError] = useState<string | null>(null)
  const editable = !field.disabled && !field.readOnly
  const full = maxApprovers !== undefined && ids.length >= maxApprovers
  const nameOf = (id: string) => known[id]?.name ?? dataSource.peekLabel?.(id) ?? id

  const move = (index: number, dir: -1 | 1) => {
    const next = [...ids]
    const a = next[index]
    const b = next[index + dir]
    if (a === undefined || b === undefined) return
    next[index] = b
    next[index + dir] = a
    setRaw(next)
  }

  return (
    <FormField
      {...field}
      group
      error={field.error ?? error}
      className={cx('erp-approver-picker', field.className)}
    >
      {(f) => (
        <div
          role='group'
          id={f.id}
          aria-labelledby={field.label != null ? f.labelId : undefined}
          aria-describedby={f.describedBy}
          className='erp-approver-picker__body'
          {...native}
        >
          {ids.length > 0 && (
            <ol
              className='erp-approver-picker__list'
              data-sequential={sequential || undefined}
              aria-label='Approvers'
            >
              {ids.map((id, i) => (
                <li
                  key={id}
                  className='erp-approver-picker__item'
                >
                  {sequential && <span className='erp-approver-picker__step'>{i + 1}</span>}
                  <span
                    className='erp-approver-picker__avatar'
                    aria-hidden='true'
                  >
                    {initials(nameOf(id))}
                  </span>
                  <span className='erp-approver-picker__name'>
                    {nameOf(id)}
                    {known[id]?.title && <span className='erp-approver-picker__title'>{known[id].title}</span>}
                  </span>
                  {editable && (
                    <span className='erp-approver-picker__actions'>
                      {sequential && (
                        <>
                          <IconButton
                            size='sm'
                            icon='arrow-up'
                            aria-label={`Move ${nameOf(id)} up`}
                            disabled={i === 0}
                            onClick={() => {
                              move(i, -1)
                            }}
                          />
                          <IconButton
                            size='sm'
                            icon='arrow-down'
                            aria-label={`Move ${nameOf(id)} down`}
                            disabled={i === ids.length - 1}
                            onClick={() => {
                              move(i, 1)
                            }}
                          />
                        </>
                      )}
                      <IconButton
                        size='sm'
                        icon='close'
                        aria-label={`Remove ${nameOf(id)}`}
                        onClick={() => {
                          setRaw(ids.filter((x) => x !== id))
                        }}
                      />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
          {editable && !full && (
            <Lookup<T>
              label='Add approver'
              columns={approverColumns<T>()}
              displayValue={(e) => e.name}
              dropdownWidth='30rem'
              hideLabel
              placeholder='Add approver…'
              size={field.size}
              dataSource={dataSource}
              value={null}
              invalid={f.invalid}
              onChange={(id, item) => {
                if (!id || !item) return
                if (excludeIds.includes(id)) {
                  setError(`${item.name} cannot approve this document`)
                  return
                }
                setError(null)
                setKnown((k) => ({ ...k, [id]: item }))
                if (!ids.includes(id)) setRaw([...ids, id])
              }}
            />
          )}
          {ids.length === 0 && !editable && <span className='erp-empty'>No approvers</span>}
        </div>
      )}
    </FormField>
  )
}
