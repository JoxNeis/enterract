import type { ReactNode, SyntheticEvent } from 'react'

/** Key of an option, row or tree node. */
export type Key = string | number

/** Density. `sm` is the compact size used in grids and dense forms. */
export type Size = 'sm' | 'md'

/** One choice in a Select, RadioGroup, MultiSelect, Lookup… */
export interface Option<K extends Key = string> {
  key: K
  label: string
  description?: string
  disabled?: boolean
  /** Options with the same group are shown under a group heading. */
  group?: string
  icon?: ReactNode
}

/** Value props shared by every form control (see FORM-CONTROL-CONTRACT.md). */
export interface ValueProps<T, E = SyntheticEvent> {
  /** Controlled value. `null` means empty. */
  value?: T | null
  /** Uncontrolled initial value. */
  defaultValue?: T | null
  /** Emits the parsed value, not raw text. */
  onChange?: (value: T | null, event?: E) => void
}

/** Field props shared by every form control (rendered by FormField). */
export interface FieldProps {
  /** Visible label. Required unless `aria-label` is given. */
  label?: ReactNode
  /** Hide the label visually but keep it for screen readers (grid cells). */
  hideLabel?: boolean
  /** Help text under the control, linked with aria-describedby. */
  helpText?: ReactNode
  /** Error message. Sets `invalid`. */
  error?: ReactNode
  /** Non-blocking warning, e.g. "Credit limit exceeded". */
  warning?: ReactNode
  /** Shows the required marker and sets aria-required. */
  required?: boolean
  /** Error styling and aria-invalid. Derived from `error` when omitted. */
  invalid?: boolean
  /** Not focusable and not submitted. */
  disabled?: boolean
  /** Focusable, value is submitted, cannot be edited. */
  readOnly?: boolean
  /** `sm` = compact density. */
  size?: Size
  className?: string
  /** Auto-generated when omitted. */
  id?: string
  /** Form field key. */
  name?: string
}
