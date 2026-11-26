import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { SearchField } from './SearchField'

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  args: {
    'aria-label': 'Search orders',
    placeholder: 'Search orders…',
    debounce: 300,
    loading: false,
    onSearch: fn(),
    onChange: fn(),
    disabled: false,
    readOnly: false,
    size: 'md',
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const box = within(canvasElement).getByRole('searchbox')
    await userEvent.type(box, 'SO-10')
    await waitFor(() => expect(args.onSearch).toHaveBeenLastCalledWith('SO-10'))
    await userEvent.keyboard('{Escape}')
    await expect(box).toHaveValue('')
  },
}

export const WithLabel: Story = { args: { label: 'Find customer', 'aria-label': undefined } }

export const Loading: Story = { args: { defaultValue: 'acme', loading: true } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'acme' } }

export const Required: Story = { args: { label: 'Keyword', required: true, 'aria-label': undefined } }

export const WithError: Story = { args: { label: 'Keyword', error: 'Type at least 2 characters', defaultValue: 'a', 'aria-label': undefined } }

export const Compact: Story = { args: { size: 'sm' } }
