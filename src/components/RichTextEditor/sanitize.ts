const ALLOWED = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'H3', 'H4', 'A', 'BLOCKQUOTE', 'DIV', 'SPAN'])
const RENAME: Record<string, string> = { B: 'strong', I: 'em', DIV: 'p' }

const safeHref = (href: string) => /^(https?:|mailto:|tel:|\/|#)/i.test(href.trim())

/**
 * Keeps only basic formatting (paragraphs, bold, italic, underline, lists, headings, links) and
 * drops every attribute except a safe `href`. Scripts, styles, event handlers and
 * `javascript:` links are removed.
 */
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const out = document.createElement('div')

  const copy = (node: Node, into: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        into.appendChild(document.createTextNode(child.textContent ?? ''))
        continue
      }
      if (!(child instanceof Element)) continue
      const tag = child.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT') continue
      if (!ALLOWED.has(tag)) {
        copy(child, into)
        continue
      }
      if (tag === 'SPAN') {
        copy(child, into)
        continue
      }
      const el = document.createElement(RENAME[tag] ?? tag.toLowerCase())
      if (tag === 'A') {
        const href = child.getAttribute('href') ?? ''
        if (safeHref(href)) {
          el.setAttribute('href', href)
          el.setAttribute('rel', 'noopener noreferrer')
          el.setAttribute('target', '_blank')
        }
      }
      copy(child, el)
      into.appendChild(el)
    }
  }

  copy(doc.body, out)
  return out.innerHTML
}

/** Plain text of an HTML fragment (for counters and search). */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  return doc.body.textContent
}
