import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { weekday } from '../../utils/date'
import { Calendar } from './Calendar'

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  args: {
    defaultValue: '2026-03-15',
    today: '2026-03-10',
    onChange: fn(),
    numberOfMonths: 1,
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    numberOfMonths: { control: 'inline-radio', options: [1, 2] },
    weekStartsOn: { control: 'inline-radio', options: [undefined, 0, 1] },
    locale: { control: 'select', options: [undefined, 'en-US', 'de-DE', 'id-ID', 'ja-JP'] },
    isDateDisabled: { control: false },
  },
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { locale: 'en-US' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /March 15, 2026/ }))
    await userEvent.keyboard('{ArrowRight}{ArrowDown}{Enter}')
    await expect(args.onChange).toHaveBeenLastCalledWith('2026-03-23', undefined)
  },
}

export const MinMax: Story = { args: { min: '2026-03-05', max: '2026-03-25' } }

export const NoWeekends: Story = {
  args: { isDateDisabled: (iso: string) => weekday(iso) === 0 || weekday(iso) === 6 },
}

export const TwoMonths: Story = { args: { numberOfMonths: 2, rangeStart: '2026-03-25', rangeEnd: '2026-04-08', defaultValue: null } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true } }
