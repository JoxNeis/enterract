import type { Meta, StoryObj } from '@storybook/react-vite'
import { formatDate } from '../../utils/date'
import { formatDecimal } from '../../utils/decimal'
import { LocaleProvider } from './LocaleProvider'
import { useLocale } from './localeContext'

function Sample() {
  const { locale, currency, timeZone } = useLocale()
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px', margin: 0 }}>
      <dt>Locale</dt>
      <dd style={{ margin: 0 }}>{locale}</dd>
      <dt>Amount</dt>
      <dd style={{ margin: 0 }}>{formatDecimal('1234567.5', locale, { currency })}</dd>
      <dt>Date</dt>
      <dd style={{ margin: 0 }}>{formatDate('2026-03-15', locale)}</dd>
      <dt>Time zone</dt>
      <dd style={{ margin: 0 }}>{timeZone}</dd>
    </dl>
  )
}

const meta = {
  title: 'Components/LocaleProvider',
  component: LocaleProvider,
  args: { locale: 'de-DE', currency: 'EUR', timeZone: 'Europe/Berlin' },
  argTypes: {
    locale: { control: 'select', options: ['en-US', 'de-DE', 'id-ID', 'fr-FR', 'ja-JP'] },
    currency: { control: 'select', options: ['USD', 'EUR', 'IDR', 'JPY'] },
    timeZone: { control: 'select', options: ['UTC', 'Europe/Berlin', 'Asia/Jakarta', 'America/New_York'] },
  },
  render: (args) => (
    <LocaleProvider {...args}>
      <Sample />
    </LocaleProvider>
  ),
} satisfies Meta<typeof LocaleProvider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Indonesia: Story = { args: { locale: 'id-ID', currency: 'IDR', timeZone: 'Asia/Jakarta' } }

export const Disabled: Story = { args: { locale: 'en-US', currency: 'USD', timeZone: 'UTC' } }
