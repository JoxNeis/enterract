import { useContext, useMemo, type ReactNode } from 'react'
import { LocaleContext, type LocaleSettings } from './localeContext'

export interface LocaleProviderProps extends Partial<LocaleSettings> {
  children?: ReactNode
}

/**
 * Sets the locale, default currency and time zone for every enterract control below it.
 * Values not given are inherited from an outer provider (default `en-US`, `USD`, `UTC`).
 */
export function LocaleProvider({ children, locale, currency, timeZone, weekStartsOn }: LocaleProviderProps) {
  const parent = useContext(LocaleContext)
  const value = useMemo<LocaleSettings>(
    () => ({
      locale: locale ?? parent.locale,
      currency: currency ?? parent.currency,
      timeZone: timeZone ?? parent.timeZone,
      weekStartsOn: weekStartsOn ?? parent.weekStartsOn,
    }),
    [locale, currency, timeZone, weekStartsOn, parent]
  )
  return <LocaleContext value={value}>{children}</LocaleContext>
}
