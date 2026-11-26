import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom gaps. Real browsers (and Storybook) have all of these.
Element.prototype.scrollIntoView = function scrollIntoView() {
  // no-op
}

class TestResizeObserver {
  observe() {
    // no-op
  }
  unobserve() {
    // no-op
  }
  disconnect() {
    // no-op
  }
}
if (!('ResizeObserver' in globalThis)) Object.assign(globalThis, { ResizeObserver: TestResizeObserver })

/** Minimal DataTransfer for clipboard and drag-and-drop tests. */
class TestDataTransfer {
  private data = new Map<string, string>()
  dropEffect = 'none'
  effectAllowed = 'all'
  files: File[] = []
  get types() {
    return [...this.data.keys()]
  }
  /** Browsers treat `text` as `text/plain` and `url` as `text/uri-list`. */
  private static normalize(type: string) {
    const t = type.toLowerCase()
    return t === 'text' ? 'text/plain' : t === 'url' ? 'text/uri-list' : t
  }
  setData(type: string, value: string) {
    this.data.set(TestDataTransfer.normalize(type), value)
  }
  getData(type: string) {
    return this.data.get(TestDataTransfer.normalize(type)) ?? ''
  }
  clearData() {
    this.data.clear()
  }
}
if (!('DataTransfer' in globalThis)) Object.assign(globalThis, { DataTransfer: TestDataTransfer })

if (!(URL as { createObjectURL?: unknown }).createObjectURL) {
  URL.createObjectURL = () => 'blob:test'
  URL.revokeObjectURL = () => {
    // no-op
  }
}

// jsdom has no canvas; components handle a null context.
HTMLCanvasElement.prototype.getContext = () => null
HTMLCanvasElement.prototype.toDataURL = () => ''
