import type { ComponentProps } from 'react'
import type { FieldProps } from '../utils/types'

/** Native `<input>` props minus those redefined by the Form Control Contract. */
export type NativeInputProps = Omit<
  ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange' | 'size' | 'prefix' | 'type' | 'checked' | 'defaultChecked' | keyof FieldProps
>

/** Native `<textarea>` props minus those redefined by the Form Control Contract. */
export type NativeTextAreaProps = Omit<
  ComponentProps<'textarea'>,
  'value' | 'defaultValue' | 'onChange' | keyof FieldProps
>

/** Native `<div>` props minus contract props, for composite controls. */
export type NativeDivProps = Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'prefix' | keyof FieldProps>
