import { useCallback, useEffect, useLayoutEffect, useRef, type Ref, type RefCallback } from 'react'

/** Combines several refs (object or callback) into one callback ref. Wrap in useMemo. */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }
  }
}

/** Returns a stable function that always calls the latest `fn`. Safe to call from event handlers and timers. */
export function useStableCallback<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const ref = useRef(fn)
  useLayoutEffect(() => {
    ref.current = fn
  })
  return useCallback((...args: A) => ref.current(...args), [])
}

/** Debounces calls to `fn` by `delay` ms. The pending call is dropped on unmount. */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay: number) {
  const stable = useStableCallback(fn)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => {
    clearTimeout(timer.current)
  }, [])
  const call = useCallback(
    (...args: A) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        stable(...args)
      }, delay)
    },
    [delay, stable]
  )
  const cancel = useCallback(() => {
    clearTimeout(timer.current)
  }, [])
  return [call, cancel] as const
}

/** Calls `handler` on pointer-down outside every element in `refs` while `enabled`. */
export function useOutsidePointerDown(
  refs: readonly { readonly current: Element | null }[],
  handler: (event: PointerEvent | MouseEvent) => void,
  enabled = true
) {
  const stable = useStableCallback(handler)
  useEffect(() => {
    if (!enabled) return
    const listener = (event: PointerEvent | MouseEvent) => {
      const target = event.target as Node | null
      if (refs.some((r) => r.current && target && r.current.contains(target))) return
      stable(event)
    }
    document.addEventListener('mousedown', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
    }
  }, [enabled, refs, stable])
}

/** Focusable descendants, in DOM order. */
export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
    )
  ).filter((el) => !el.hasAttribute('inert') && el.getAttribute('aria-hidden') !== 'true')
}

/** Keeps Tab focus inside `ref` while `enabled` and restores focus on disable. */
export function useFocusTrap(ref: { readonly current: HTMLElement | null }, enabled: boolean) {
  useEffect(() => {
    const root = ref.current
    if (!enabled || !root) return
    const previous = document.activeElement as HTMLElement | null
    const first = getFocusable(root)[0]
    ;(root.querySelector<HTMLElement>('[autofocus], [data-autofocus]') ?? first ?? root).focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = getFocusable(root)
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const head = items[0]
      const tail = items[items.length - 1]
      if (event.shiftKey && document.activeElement === head) {
        event.preventDefault()
        tail?.focus()
      } else if (!event.shiftKey && document.activeElement === tail) {
        event.preventDefault()
        head?.focus()
      }
    }
    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [enabled, ref])
}
