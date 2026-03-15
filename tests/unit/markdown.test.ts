import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '@/lib/utils/markdown'

describe('renderMarkdown', () => {
  it('renders a Markdown heading to an <h1> element', async () => {
    const result = await renderMarkdown('# Hello World')
    expect(result).toContain('<h1')
    expect(result).toContain('Hello World')
  })

  it('renders a level-2 heading', async () => {
    const result = await renderMarkdown('## Section')
    expect(result).toContain('<h2')
  })

  it('renders bold text to <strong>', async () => {
    const result = await renderMarkdown('**bold text**')
    expect(result).toContain('<strong>')
    expect(result).toContain('bold text')
  })

  it('renders italic text to <em>', async () => {
    const result = await renderMarkdown('*italic*')
    expect(result).toContain('<em>')
  })

  it('renders Markdown links to <a> elements', async () => {
    const result = await renderMarkdown('[click here](https://example.com)')
    expect(result).toContain('<a')
    expect(result).toContain('https://example.com')
    expect(result).toContain('click here')
  })

  it('renders a code block', async () => {
    const result = await renderMarkdown('```\nconst x = 1\n```')
    expect(result).toContain('<code>')
  })

  // ── XSS sanitization ──────────────────────────────

  it('strips <script> tags', async () => {
    const result = await renderMarkdown('<script>alert("xss")</script>')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('alert')
  })

  it('strips <iframe> tags', async () => {
    const result = await renderMarkdown('<iframe src="https://evil.com"></iframe>')
    expect(result).not.toContain('<iframe')
  })

  it('strips <object> tags', async () => {
    const result = await renderMarkdown('<object data="evil.swf"></object>')
    expect(result).not.toContain('<object')
  })

  it('strips onclick attribute from inline HTML', async () => {
    const result = await renderMarkdown('<a href="#" onclick="evil()">click</a>')
    expect(result).not.toContain('onclick')
  })

  it('strips onerror attribute', async () => {
    const result = await renderMarkdown('<img src="x" onerror="evil()">')
    expect(result).not.toContain('onerror')
  })

  it('strips onload attribute', async () => {
    const result = await renderMarkdown('<body onload="evil()">text</body>')
    expect(result).not.toContain('onload')
  })

  // ── Edge cases ────────────────────────────────────

  it('returns empty string for empty input', async () => {
    const result = await renderMarkdown('')
    expect(result.trim()).toBe('')
  })

  it('returns empty string for whitespace-only input', async () => {
    const result = await renderMarkdown('   ')
    expect(result.trim()).toBe('')
  })
})
