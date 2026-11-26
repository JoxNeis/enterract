import { getFocusable } from './hooks'

/** Focus a field by id, or its first focusable descendant (radio groups, composite controls). */
export function focusField(fieldId: string) {
  const el = document.getElementById(fieldId)
  if (!el) return
  const target = el.matches('input, select, textarea, button, [tabindex]') ? el : (getFocusable(el)[0] ?? el)
  target.focus()
  target.scrollIntoView({ block: 'center' })
}
