import { createContext, useContext } from 'react'

export interface LocaleSettings {
  /** BCP 47 locale used for number and date parsing/formatting. */
  locale: string
  /** Default ISO 4217 currency for CurrencyField and money display. */
  currency: string
  /** IANA time zone for DateTimePicker. */
  timeZone: string
  /** First day of the week, 0 = Sunday. Derived from the locale when omitted. */
  weekStartsOn?: number
}

export const defaultLocaleSettings: LocaleSettings = {
  locale: 'en-US',
  currency: 'USD',
  timeZone: 'UTC',
}

export const LocaleContext = createContext<LocaleSettings>(defaultLocaleSettings)

/** Locale settings from the nearest LocaleProvider. A `locale` argument overrides the context. */
export function useLocale(override?: string): LocaleSettings {
  const settings = useContext(LocaleContext)
  return override ? { ...settings, locale: override } : settings
}
