import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { extendedQuantities, flattenRequirements, type BomComponent } from './bom'
import { BomEditor } from './BomEditor'
import { shelfBom } from './BomEditor.fixtures'

describe('bom math', () => {
  it('extends quantities through the tree with scrap', () => {
    const ext = extendedQuantities(shelfBom, 10)
    expect(ext.get('frame')).toBe(10)
    expect(ext.get('post')).toBe(40)
    expect(ext.get('beam')).toBe(81.6)
    expect(ext.get('shelf')).toBe(52.5)
  })

  it('totals leaf requirements per item', () => {
    expect(flattenRequirements(shelfBom, 2).get('BOLT-M8')).toBe(72)
  })
})

describe('BomEditor', () => {
  it('shows extended quantities for the build quantity', async () => {
    render(
      <BomEditor
        productName='Shelving unit'
        defaultValue={shelfBom}
        className='extra'
      />
    )
    const grid = screen.getByRole('treegrid', { name: 'Bill of materials for Shelving unit' })
    expect(grid.closest('.erp-bom-editor')).toHaveClass('extra')
    expect(screen.getByRole('gridcell', { name: 'Extended qty: 8.16' })).toBeInTheDocument()
    const build = screen.getByRole('textbox', { name: 'Build quantity' })
    await userEvent.clear(build)
    await userEvent.type(build, '10')
    expect(screen.getByRole('gridcell', { name: 'Extended qty: 81.6' })).toBeInTheDocument()
  })

  it('adds and removes components', async () => {
    const onChange = vi.fn<(lines: BomComponent[]) => void>()
    render(
      <BomEditor
        defaultValue={shelfBom}
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add component under SHELF-90' }))
    expect(onChange.mock.lastCall?.[0][1]?.children).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: 'Remove BEAM-90' }))
    expect(onChange.mock.lastCall?.[0][0]?.children).toHaveLength(2)
  })

  it('is read-only', () => {
    render(
      <BomEditor
        defaultValue={shelfBom}
        readOnly
      />
    )
    expect(screen.queryByRole('button', { name: 'Add component' })).toBeNull()
    expect(screen.getByRole('gridcell', { name: 'Qty per: 4.0000' })).toHaveAttribute('aria-readonly', 'true')
  })
})
