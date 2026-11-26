import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Alert } from '../Alert'
import { ToastContext, type ToastApi, type ToastItem, type ToastOptions } from './toastContext'
import './Toast.css'

export interface ToastProps {
  toast: ToastItem
  onDismiss: (id: number) => void
}

/** One notification. Usually rendered by ToastProvider; pauses its timer on hover and focus. */
export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, tone = 'info', title, message, action } = toast
  const duration = toast.duration ?? (tone === 'error' ? 0 : 5000)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (duration <= 0 || paused) return
    const timer = setTimeout(() => {
      onDismiss(id)
    }, duration)
    return () => {
      clearTimeout(timer)
    }
  }, [duration, paused, id, onDismiss])

  return (
    <Alert
      className='erp-toast'
      tone={tone}
      title={title}
      live='off'
      onDismiss={() => {
        onDismiss(id)
      }}
      onMouseEnter={() => {
        setPaused(true)
      }}
      onMouseLeave={() => {
        setPaused(false)
      }}
      onFocus={() => {
        setPaused(true)
      }}
      onBlur={() => {
        setPaused(false)
      }}
      actions={
        action && (
          <button
            type='button'
            className='erp-toast__action'
            onClick={() => {
              action.onClick()
              onDismiss(id)
            }}
          >
            {action.label}
          </button>
        )
      }
    >
      {message}
    </Alert>
  )
}

export interface ToastProviderProps {
  children?: ReactNode
  /** Screen corner. */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center'
  /** Most toasts shown at once; older ones are dropped. */
  max?: number
}

/** Provides `useToast()` and renders the notification region. */
export function ToastProvider({ children, position = 'bottom-right', max = 4 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const api = useMemo<ToastApi>(() => {
    const show = (options: ToastOptions) => {
      const id = nextId.current++
      setToasts((list) => [...list, { ...options, id }].slice(-max))
      return id
    }
    return {
      show,
      success: (message, options) => show({ ...options, tone: 'success', message }),
      error: (message, options) => show({ ...options, tone: 'error', message }),
      dismiss,
    }
  }, [dismiss, max])

  return (
    <ToastContext value={api}>
      {children}
      {createPortal(
        <section
          className='erp-toast-region'
          data-position={position}
          aria-label='Notifications'
          aria-live='polite'
          aria-relevant='additions'
        >
          {toasts.map((t) => (
            <Toast
              key={t.id}
              toast={t}
              onDismiss={dismiss}
            />
          ))}
        </section>,
        document.body
      )}
    </ToastContext>
  )
}
