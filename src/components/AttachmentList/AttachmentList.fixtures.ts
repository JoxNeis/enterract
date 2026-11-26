import type { Attachment } from './AttachmentList'

export const attachments: Attachment[] = [
  {
    id: 'a1',
    name: 'PO-2026-0142.pdf',
    size: 182_400,
    type: 'application/pdf',
    uploadedAt: '2026-03-14T08:12:00Z',
    uploadedBy: 'Dewi Lestari',
  },
  {
    id: 'a2',
    name: 'delivery-note-scan.jpg',
    size: 1_540_000,
    type: 'image/jpeg',
    uploadedAt: '2026-03-15T10:40:00Z',
    uploadedBy: 'Markus Weber',
  },
  {
    id: 'a3',
    name: 'price-agreement-2026.xlsx',
    size: 48_200,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedAt: '2026-03-15T11:02:00Z',
    uploadedBy: 'Dewi Lestari',
  },
]

/** Fake upload: progresses in 5 fixed steps, then resolves. */
export function fakeUpload(_file: File, ctx: { onProgress: (p: number) => void; signal: AbortSignal }) {
  return new Promise<void>((resolve, reject) => {
    let step = 0
    const timer = setInterval(() => {
      step += 1
      ctx.onProgress(step / 5)
      if (step === 5) {
        clearInterval(timer)
        resolve()
      }
    }, 200)
    ctx.signal.addEventListener('abort', () => {
      clearInterval(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}
