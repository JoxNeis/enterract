import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GanttChart } from './GanttChart'
import { projectTasks } from './GanttChart.fixtures'

describe('GanttChart', () => {
  it('renders tasks with accessible bars, milestones and late marks', () => {
    render(
      <GanttChart
        aria-label='ERP rollout'
        tasks={projectTasks}
        today='2026-03-16'
        className='extra'
      />
    )
    expect(screen.getByRole('group', { name: 'ERP rollout' })).toHaveClass('erp-gantt', 'extra')
    expect(screen.getByRole('rowheader', { name: 'Configure finance module' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Requirements, Mar 2 to Mar 6, 100% complete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Data migration design, Mar 9 to Mar 13, 60% complete, late' })).toHaveAttribute('data-late', 'true')
    expect(screen.getByRole('button', { name: 'Go-live, milestone on Mar 30' })).toBeInTheDocument()
    expect(screen.getByTitle('Today, Mar 16')).toBeInTheDocument()
  })

  it('moves and resizes a task with the keyboard', async () => {
    const onTaskChange = vi.fn()
    render(
      <GanttChart
        aria-label='ERP rollout'
        tasks={projectTasks}
        today='2026-03-01'
        onTaskChange={onTaskChange}
      />
    )
    screen.getByRole('button', { name: /^User training/ }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onTaskChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 't4', start: '2026-03-24', end: '2026-03-28' }))
    await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    expect(onTaskChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 't4', start: '2026-03-23', end: '2026-03-26' }))
  })

  it('reports clicks', async () => {
    const onTaskClick = vi.fn()
    render(
      <GanttChart
        aria-label='Plan'
        tasks={projectTasks}
        onTaskClick={onTaskClick}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /^Requirements/ }))
    expect(onTaskClick).toHaveBeenCalledWith(projectTasks[0])
  })
})
