import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { Option } from '../../utils/types'
import { Listbox, type ListboxProps } from './Listbox'

const currencies: Option[] = [
  { key: 'USD', label: 'US Dollar', description: 'USD', group: 'Americas' },
  { key: 'CAD', label: 'Canadian Dollar', description: 'CAD', group: 'Americas' },
  { key: 'BRL', label: 'Brazilian Real', description: 'BRL', group: 'Americas', disabled: true },
  { key: 'EUR', label: 'Euro', description: 'EUR', group: 'Europe' },
  { key: 'GBP', label: 'Pound Sterling', description: 'GBP', group: 'Europe' },
  { key: 'IDR', label: 'Indonesian Rupiah', description: 'IDR', group: 'Asia' },
  { key: 'JPY', label: 'Japanese Yen', description: 'JPY', group: 'Asia' },
]

function StatefulListbox(args: ListboxProps) {
  const [active, setActive] = useState(args.activeIndex ?? 0)
  const [selected, setSelected] = useState<string[]>([...(args.selected ?? [])])
  return (
    <div style={{ width: 280, border: '1px solid var(--erp-color-border)', borderRadius: 4 }}>
      <Listbox
        {...args}
        activeIndex={active}
        onActiveIndexChange={setActive}
        selected={selected}
        onSelect={(option, index) => {
          setSelected((prev) =>
            args.multiple
              ? prev.includes(option.key)
                ? prev.filter((k) => k !== option.key)
                : [...prev, option.key]
              : [option.key]
          )
          args.onSelect?.(option, index)
        }}
      />
    </div>
  )
}

const meta = {
  title: 'Components/Listbox',
  component: Listbox,
  args: {
    id: 'currency-list',
    'aria-label': 'Currency',
    options: currencies,
    focusable: true,
    multiple: false,
    loading: false,
    onSelect: fn(),
  },
  argTypes: {
    options: { control: false },
    renderOption: { control: false },
  },
  render: (args) => <StatefulListbox {...(args as ListboxProps)} />,
} satisfies Meta<typeof Listbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const list = within(canvasElement).getByRole('listbox')
    list.focus()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(args.onSelect).toHaveBeenCalled()
    await expect(within(list).getByRole('option', { name: /canadian/i })).toHaveAttribute('aria-selected', 'true')
  },
}

export const Multiple: Story = { args: { multiple: true, selected: ['EUR', 'IDR'] } }

export const Loading: Story = { args: { loading: true, options: [] } }

export const Empty: Story = { args: { options: [], emptyText: 'No currencies match' } }

export const Disabled: Story = {
  args: { options: currencies.map((c) => ({ ...c, disabled: true })) },
}
