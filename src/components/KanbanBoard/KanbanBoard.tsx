import { useEffect, useRef, useState, type ComponentProps, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { formatDate } from '../../utils/date'
import { flag } from '../../utils/flag'
import { initials } from '../../utils/format'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { Tag } from '../Tag'
import { moveCard } from './moveCard'
import './KanbanBoard.css'

export interface KanbanColumn {
  key: string
  title: string
  /** Work-in-progress limit; the column warns when exceeded. */
  limit?: number
}

export interface KanbanCard {
  id: string
  column: string
  title: string
  description?: string
  tags?: string[]
  assignee?: string
  /** ISO date. */
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface KanbanBoardProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  columns: readonly KanbanColumn[]
  /** Cards in display order. */
  cards: readonly KanbanCard[]
  /** Card dropped into `column` at `index` (position among that column's cards). */
  onCardMove?: (cardId: string, column: string, index: number) => void
  /** Card activated with a double-click or Enter… after it was dropped (Enter on an idle card opens it). */
  onCardOpen?: (card: KanbanCard) => void
  renderCard?: (card: KanbanCard) => ReactNode
  /** Fixed "today" for overdue marks. */
  today?: string
  'aria-label': string
}

interface Picked {
  id: string
  column: string
  index: number
  from: { column: string; index: number }
}

/**
 * Board of cards in columns (order status, tasks, opportunities). Drag cards with the mouse, or
 * with the keyboard: Space picks a card up, arrows move it, Space drops, Escape cancels.
 */
export function KanbanBoard({
  columns,
  cards,
  onCardMove,
  onCardOpen,
  renderCard,
  today,
  className,
  'aria-label': ariaLabel,
  ...props
}: KanbanBoardProps) {
  const { locale } = useLocale()
  const [picked, setPicked] = useState<Picked | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ column: string; index: number } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const boardRef = useRef<HTMLDivElement>(null)
  const focusId = useRef<string | null>(null)

  useEffect(() => {
    if (!focusId.current) return
    const id = focusId.current
    focusId.current = null
    Array.from(boardRef.current?.querySelectorAll<HTMLElement>('[data-card-id]') ?? [])
      .find((el) => el.dataset.cardId === id)
      ?.focus()
  })

  const shown = picked ? moveCard(cards, picked.id, picked.column, picked.index) : cards
  const columnCards = (key: string) => shown.filter((c) => c.column === key)
  const title = (key: string) => columns.find((c) => c.key === key)?.title ?? key

  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>, card: KanbanCard) => {
    const list = columnCards(card.column)
    const index = list.findIndex((c) => c.id === card.id)
    if (!picked) {
      if (event.key === ' ' && onCardMove) {
        event.preventDefault()
        setPicked({ id: card.id, column: card.column, index, from: { column: card.column, index } })
        setAnnouncement(`Picked up ${card.title}. Use arrow keys to move, Space to drop, Escape to cancel.`)
        focusId.current = card.id
      } else if (event.key === 'Enter') {
        event.preventDefault()
        onCardOpen?.(card)
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const next = list[index + (event.key === 'ArrowDown' ? 1 : -1)]
        if (next) {
          focusId.current = next.id
          setAnnouncement('')
        }
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()
        const ci = columns.findIndex((c) => c.key === card.column)
        const target = columns[ci + (event.key === 'ArrowRight' ? 1 : -1)]
        const first = target ? columnCards(target.key)[Math.min(index, columnCards(target.key).length - 1)] : undefined
        if (first) {
          focusId.current = first.id
          setAnnouncement('')
        }
      }
      return
    }
    if (picked.id !== card.id) return
    event.preventDefault()
    const ci = columns.findIndex((c) => c.key === picked.column)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const count = columnCards(picked.column).length
      const nextIndex = Math.max(0, Math.min(count - 1, picked.index + (event.key === 'ArrowDown' ? 1 : -1)))
      setPicked({ ...picked, index: nextIndex })
      setAnnouncement(`${card.title}: position ${String(nextIndex + 1)} of ${String(count)} in ${title(picked.column)}`)
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const target = columns[ci + (event.key === 'ArrowRight' ? 1 : -1)]
      if (target) {
        const count = cards.filter((c) => c.column === target.key && c.id !== picked.id).length
        const nextIndex = Math.min(picked.index, count)
        setPicked({ ...picked, column: target.key, index: nextIndex })
        setAnnouncement(`${card.title}: moved to ${target.title}, position ${String(nextIndex + 1)}`)
      }
    } else if (event.key === ' ' || event.key === 'Enter') {
      onCardMove?.(picked.id, picked.column, picked.index)
      setAnnouncement(`Dropped ${card.title} in ${title(picked.column)}, position ${String(picked.index + 1)}`)
      setPicked(null)
    } else if (event.key === 'Escape') {
      setAnnouncement(`Move cancelled. ${card.title} returned to ${title(picked.from.column)}`)
      setPicked(null)
    }
    focusId.current = card.id
  }

  const onDragOverCard = (event: DragEvent<HTMLElement>, column: string, index: number) => {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const after = event.clientY > rect.top + rect.height / 2
    setDropTarget({ column, index: index + (after ? 1 : 0) })
  }

  const drop = (column: string) => {
    if (dragId) {
      const card = cards.find((c) => c.id === dragId)
      const index = dropTarget?.column === column ? dropTarget.index : columnCards(column).length
      const ownIndex = card?.column === column ? columnCards(column).findIndex((c) => c.id === dragId) : -1
      onCardMove?.(dragId, column, ownIndex >= 0 && ownIndex < index ? index - 1 : index)
    }
    setDragId(null)
    setDropTarget(null)
  }

  return (
    <div
      ref={boardRef}
      className={cx('erp-kanban', className)}
      role='region'
      aria-label={ariaLabel}
      aria-roledescription='board'
      {...props}
    >
      {columns.map((col) => {
        const list = columnCards(col.key)
        const over = col.limit !== undefined && list.length > col.limit
        return (
          <section
            key={col.key}
            className='erp-kanban__column'
            data-over-limit={flag(over)}
            data-drop={flag(dropTarget?.column === col.key)}
            aria-label={`${col.title}, ${String(list.length)} cards${col.limit !== undefined ? `, limit ${String(col.limit)}` : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              if (dropTarget?.column !== col.key) setDropTarget({ column: col.key, index: list.length })
            }}
            onDrop={(event) => {
              event.preventDefault()
              drop(col.key)
            }}
          >
            <header className='erp-kanban__header'>
              <h3>{col.title}</h3>
              <span className='erp-kanban__count'>
                {list.length}
                {col.limit !== undefined && ` / ${String(col.limit)}`}
              </span>
              {over && (
                <Icon
                  name='warning'
                  label='Over the work-in-progress limit'
                  className='erp-kanban__warning'
                />
              )}
            </header>
            <ul className='erp-kanban__cards'>
              {list.map((card, index) => {
                const overdue = card.dueDate !== undefined && today !== undefined && card.dueDate < today
                return (
                  <li
                    key={card.id}
                    data-card-id={card.id}
                    tabIndex={0}
                    draggable={onCardMove !== undefined}
                    aria-roledescription='card'
                    aria-describedby={`${card.id}-hint`}
                    className='erp-kanban__card'
                    data-picked={flag(picked?.id === card.id)}
                    data-dragging={flag(dragId === card.id)}
                    data-drop-before={flag(dropTarget?.column === col.key && dropTarget.index === index && dragId !== null)}
                    data-priority={card.priority}
                    onKeyDown={(event) => {
                      onCardKeyDown(event, card)
                    }}
                    onDoubleClick={() => onCardOpen?.(card)}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/plain', card.id)
                      setDragId(card.id)
                    }}
                    onDragEnd={() => {
                      setDragId(null)
                      setDropTarget(null)
                    }}
                    onDragOver={(event) => {
                      onDragOverCard(event, col.key, index)
                    }}
                  >
                    {renderCard ? (
                      renderCard(card)
                    ) : (
                      <>
                        <div className='erp-kanban__title'>{card.title}</div>
                        {card.description && <div className='erp-kanban__description'>{card.description}</div>}
                        {card.tags && card.tags.length > 0 && (
                          <div className='erp-kanban__tags'>
                            {card.tags.map((t) => (
                              <Tag
                                key={t}
                                size='sm'
                              >
                                {t}
                              </Tag>
                            ))}
                          </div>
                        )}
                        <div className='erp-kanban__meta'>
                          {card.priority === 'high' && (
                            <span className='erp-kanban__priority'>
                              <Icon name='arrow-up' /> High
                            </span>
                          )}
                          {card.dueDate && (
                            <span
                              className='erp-kanban__due'
                              data-overdue={flag(overdue)}
                            >
                              <Icon name='calendar' /> {formatDate(card.dueDate, locale, { month: 'short', day: 'numeric' })}
                              {overdue && ' (overdue)'}
                            </span>
                          )}
                          {card.assignee && (
                            <span
                              className='erp-kanban__avatar'
                              title={card.assignee}
                            >
                              <span aria-hidden='true'>{initials(card.assignee)}</span>
                              <span className='erp-visually-hidden'>Assigned to {card.assignee}</span>
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    <span
                      id={`${card.id}-hint`}
                      className='erp-visually-hidden'
                    >
                      {onCardMove ? 'Press Space to move.' : ''}
                      {onCardOpen ? ' Press Enter to open.' : ''}
                    </span>
                  </li>
                )
              })}
              {dragId && dropTarget?.column === col.key && dropTarget.index >= list.length && (
                <li
                  className='erp-kanban__placeholder'
                  aria-hidden='true'
                />
              )}
            </ul>
          </section>
        )
      })}
      <div
        role='status'
        aria-live='assertive'
        className='erp-visually-hidden'
      >
        {announcement}
      </div>
    </div>
  )
}
