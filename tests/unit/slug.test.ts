import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/utils/slug'

describe('generateSlug', () => {
  it('converts basic ASCII title to slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('lowercases the result', () => {
    expect(generateSlug('NEXT.JS Tutorial')).toBe('next-js-tutorial')
  })

  it('strips Latin diacritics (NFD normalisation)', () => {
    expect(generateSlug('Héllo Wörld')).toBe('hello-world')
  })

  it('strips accented characters in more complex phrases', () => {
    expect(generateSlug('Café au lait')).toBe('cafe-au-lait')
  })

  it('collapses consecutive special chars to a single hyphen', () => {
    expect(generateSlug('hello   world!!!')).toBe('hello-world')
  })

  it('collapses mixed punctuation to a single hyphen', () => {
    expect(generateSlug('foo -- bar & baz')).toBe('foo-bar-baz')
  })

  it('trims leading hyphens', () => {
    expect(generateSlug('  hello world')).toBe('hello-world')
  })

  it('trims trailing hyphens', () => {
    expect(generateSlug('hello world  ')).toBe('hello-world')
  })

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })

  it('handles string with only special chars', () => {
    expect(generateSlug('---!!!')).toBe('')
  })

  it('truncates at 80 chars without a mid-word break', () => {
    // Build a slug that would be > 80 chars: 16 × 'abcde-' = 96 chars
    const longTitle = Array(16).fill('abcde').join(' ')
    const result = generateSlug(longTitle)

    expect(result.length).toBeLessThanOrEqual(80)
    expect(result).not.toMatch(/-$/)
    // Should end at a hyphen boundary — last char is alphanumeric
    expect(result).toMatch(/[a-z0-9]$/)
  })

  it('falls back to hard 80-char truncation when no hyphen boundary exists', () => {
    // A single word of 100 chars has no hyphens after replacement
    const longWord = 'a'.repeat(100)
    const result = generateSlug(longWord)
    expect(result.length).toBe(80)
  })
})
