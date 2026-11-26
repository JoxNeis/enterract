import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { buildFiscalCalendar } from './fiscalCalendar'
import { FiscalPeriodPicker } from './FiscalPeriodPicker'

/** April–March fiscal year with a 13th adjustment period; periods before June 2025 are closed. */
const calendar = buildFiscalCalendar({ startMonth: 4, firstYear: 2025, count: 3, adjustmentPeriod: true, closedBefore: '2025-06-01' })

const meta = {
  title: 'Components/FiscalPeriodPicker',
  component: FiscalPeriodPicker,
  args: {
    label: 'Posting period',
    calendar,
    defaultYear: 'FY2026',
    allowClosed: false,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: { calendar: { control: false }, size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 300 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FiscalPeriodPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /posting period/i }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('gridcell', { name: /^P04/ }))
    await expect(args.onChange).toHaveBeenCalledWith('FY2026-P04', expect.objectContaining({ from: '2025-07-01' }))
  },
}

export const ReportingAllowsClosed: Story = { args: { label: 'Report period', allowClosed: true, defaultValue: 'FY2026-P01' } }

export const CalendarYear: Story = {
  args: { calendar: buildFiscalCalendar({ startMonth: 1, firstYear: 2026, count: 1 }), defaultYear: 'FY2026' },
}

export const Disabled: Story = { args: { disabled: true, defaultValue: 'FY2026-P05' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'FY2026-P05' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { error: 'Choose an open period', defaultValue: 'FY2026-P02' } }

export const Compact: Story = { args: { size: 'sm' } }
