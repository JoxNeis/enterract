import { useEffect } from 'react'

/**
 * Asks the browser to confirm before leaving the page while `when` is true (e.g. `form.isDirty`
 * or a grid's `isDirty`). In-app navigation needs your router's own blocker.
 */
export function useUnsavedChangesPrompt(when: boolean) {
  useEffect(() => {
    if (!when) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [when])
}
