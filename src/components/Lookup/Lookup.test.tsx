import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createInMemorySource } from './dataSource'
import { Lookup } from './Lookup'
import { customers, instantCustomerSource, type Customer } from './Lookup.fixtures'

describe('createInMemorySource', () => {
  it('searches and pages', async () => {
    const page = await instantCustomerSource.search({ search: 'jakarta', page: 0, pageSize: 3, signal: new AbortController().signal })
    expect(page.items).toHaveLength(3)
    expect(page.hasMore).toBe(true)
    expect(instantCustomerSource.peekLabel?.('C1001')).toBe('Acme Trading')
    expect(instantCustomerSource.resolveText?.('acme trading')).toBe('C1001')
  })
})

describe('Lookup', () => {
  it('searches as you type and picks with Enter', async () => {
    const onChange = vi.fn()
    render(
      <Lookup<Customer>
        label='Customer'
        dataSource={instantCustomerSource}
        debounce={0}
        onChange={onChange}
        className='extra'
      />
    )

    const input = screen.getByRole('combobox', { name: 'Customer' })
    expect(input.closest('.erp-form-field')).toHaveClass('erp-lookup', 'extra')
    await userEvent.type(input, 'borneo')
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /borneo logistics$/i })).toBeInTheDocument()
    })
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('C1002', customers[1])
    expect(input).toHaveValue('Borneo Logistics')
  })

  it('resolves the label of an initial key', async () => {
    render(
      <Lookup<Customer>
        label='Customer'
        dataSource={createInMemorySource(customers, { getKey: (c) => c.code, getLabel: (c) => `${c.code} · ${c.name}` })}
        defaultValue='C1003'
      />
    )
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue('C1003 · Cahaya Elektrik')
    })
  })

  it('opens with F4, shows columns and loads more pages', async () => {
    render(
      <Lookup<Customer>
        label='Customer'
        dataSource={instantCustomerSource}
        pageSize={10}
        columns={[
          { key: 'code', header: 'Code', width: '5rem' },
          { key: 'name', header: 'Name' },
          { key: 'city', header: 'City' },
        ]}
      />
    )

    screen.getByRole('combobox').focus()
    await userEvent.keyboard('{F4}')
    await waitFor(() => {
      expect(screen.getAllByRole('option')).toHaveLength(10)
    })
    expect(screen.getByText('10 of 48')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))
    await waitFor(() => {
      expect(screen.getAllByRole('option')).toHaveLength(20)
    })
  })

  it('Escape restores the previous value', async () => {
    render(
      <Lookup<Customer>
        label='Customer'
        dataSource={instantCustomerSource}
        defaultValue='C1001'
        selectedItem={customers[0]}
      />
    )
    const input = screen.getByRole('combobox')
    await userEvent.clear(input)
    await userEvent.type(input, 'xyz{Escape}')
    expect(input).toHaveValue('Acme Trading')
  })

  it('is read-only', async () => {
    const onChange = vi.fn()
    render(
      <Lookup<Customer>
        label='Customer'
        dataSource={instantCustomerSource}
        readOnly
        onChange={onChange}
      />
    )
    await userEvent.type(screen.getByRole('combobox'), 'a{F4}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Show results' })).toBeNull()
  })
})
