import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

/**
 * renderMarkdown — converts raw Markdown to sanitized HTML.
 *
 * - Uses marked v17 (async) to parse Markdown → HTML
 * - Sanitizes with sanitize-html (pure Node.js, no jsdom dependency)
 * - Safe for use in both Server Components (Node) and browser (Client Components)
 */
export async function renderMarkdown(raw: string): Promise<string> {
  if (!raw || !raw.trim()) return ''

  const html = await marked.parse(raw)

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter(
      (tag) => !['script', 'iframe', 'object', 'embed'].includes(tag)
    ),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': [],
    },
    disallowedTagsMode: 'discard',
  })
}
