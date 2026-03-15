import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

/**
 * renderMarkdown — converts raw Markdown to sanitized HTML.
 *
 * - Uses marked v17 (async) to parse Markdown → HTML
 * - Sanitizes with DOMPurify, blocking dangerous tags and attributes
 * - Safe for use in both Server Components (Node) and browser (Client Components)
 */
export async function renderMarkdown(raw: string): Promise<string> {
  if (!raw || !raw.trim()) return ''

  const html = await marked.parse(raw)

  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload'],
  })
}
