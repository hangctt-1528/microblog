import { describe, it, expect } from 'vitest'
import { commentSchema } from '@/lib/validations/comment'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

const validPayload = {
  post_id: VALID_UUID,
  author_name: 'Jane Smith',
  author_email: 'jane@example.com',
  body: 'Great post! Really enjoyed reading this.',
}

describe('commentSchema', () => {
  // ── Valid payload ─────────────────────────────────

  it('accepts a fully valid payload', () => {
    const result = commentSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('accepts author_name at exactly 200 chars', () => {
    const result = commentSchema.safeParse({
      ...validPayload,
      author_name: 'a'.repeat(200),
    })
    expect(result.success).toBe(true)
  })

  it('accepts body at exactly 5000 chars', () => {
    const result = commentSchema.safeParse({
      ...validPayload,
      body: 'a'.repeat(5000),
    })
    expect(result.success).toBe(true)
  })

  // ── author_name validation ────────────────────────

  it('fails when author_name is empty string', () => {
    const result = commentSchema.safeParse({ ...validPayload, author_name: '' })
    expect(result.success).toBe(false)
  })

  it('fails when author_name exceeds 200 chars', () => {
    const result = commentSchema.safeParse({
      ...validPayload,
      author_name: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  // ── author_email validation ───────────────────────

  it('fails when author_email is not a valid email', () => {
    const result = commentSchema.safeParse({
      ...validPayload,
      author_email: 'notanemail',
    })
    expect(result.success).toBe(false)
  })

  it('fails when author_email is missing @', () => {
    const result = commentSchema.safeParse({
      ...validPayload,
      author_email: 'userexample.com',
    })
    expect(result.success).toBe(false)
  })

  it('fails when author_email is empty string', () => {
    const result = commentSchema.safeParse({
      ...validPayload,
      author_email: '',
    })
    expect(result.success).toBe(false)
  })

  // ── body validation ───────────────────────────────

  it('fails when body is empty string', () => {
    const result = commentSchema.safeParse({ ...validPayload, body: '' })
    expect(result.success).toBe(false)
  })

  it('fails when body exceeds 5000 chars', () => {
    const result = commentSchema.safeParse({
      ...validPayload,
      body: 'a'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  // ── post_id validation ────────────────────────────

  it('fails when post_id is missing', () => {
    const { post_id, ...rest } = validPayload
    const result = commentSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('fails when post_id is not a valid UUID', () => {
    const result = commentSchema.safeParse({
      ...validPayload,
      post_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })
})
