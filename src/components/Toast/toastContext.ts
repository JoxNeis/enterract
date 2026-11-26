import { createContext, useContext, type ReactNode } from 'react'
import type { AlertTone } from '../Alert'

export interface ToastOptions {
  tone?: AlertTone
  title?: ReactNode
  message?: ReactNode
  /** ms before it hides. `0` keeps it until dismissed. Errors default to 0. */
  duration?: number
  /** A single action, e.g. Undo. */
  action?: { label: string; onClick: () => void }
}

export interface ToastItem extends ToastOptions {
  id: number
}

export interface ToastApi {
  /** Shows a toast and returns its id. */
  show: (options: ToastOptions) => number
  success: (message: ReactNode, options?: ToastOptions) => number
  error: (message: ReactNode, options?: ToastOptions) => number
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

/** Shows toasts. Requires a ToastProvider above. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}
