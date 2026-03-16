import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Regression tests for post query guards.
 *
 * We verify that the filter logic of each public-facing query function
 * applies the required `status = 'published'` and `deleted_at IS NULL`
 * conditions by inspecting the Supabase query builder calls via spies.
 */

// ── Hoisted mock setup (vi.mock factory is hoisted to the top) ───────────────

const { mockFromFn } = vi.hoisted(() => {
  const mockFromFn = vi.fn()
  return { mockFromFn }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFromFn }),
}))

// ── Helper: create a chainable builder ───────────────────────────────────────

function makeChainable() {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {}

  const methods = ['select', 'eq', 'is', 'order', 'single', 'range', 'neq']
  for (const m of methods) {
    builder[m] = vi.fn().mockReturnThis()
  }

  // Terminals
  builder.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
  // order() → when awaited directly it resolves
  const thenFn = (resolve: (v: { data: unknown[]; error: null }) => void) =>
    resolve({ data: [], error: null })
  builder.order.mockReturnValue({
    ...builder,
    then: thenFn,
    range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
  })

  return builder
}

// ── Import the modules under test ────────────────────────────────────────────

import { getPublishedPosts, getPostBySlug, getAdminPosts } from '@/lib/queries/posts'
import { getPostsByTag } from '@/lib/queries/tags'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getPublishedPosts', () => {
  beforeEach(() => {
    mockFromFn.mockReset()
    mockFromFn.mockReturnValue(makeChainable())
  })

  it('filters by status = published', async () => {
    await getPublishedPosts().catch(() => {})
    const builder = mockFromFn.mock.results[0].value
    expect(builder.eq).toHaveBeenCalledWith('status', 'published')
  })

  it('filters by deleted_at IS NULL', async () => {
    await getPublishedPosts().catch(() => {})
    const builder = mockFromFn.mock.results[0].value
    expect(builder.is).toHaveBeenCalledWith('deleted_at', null)
  })
})

describe('getPostBySlug', () => {
  beforeEach(() => {
    mockFromFn.mockReset()
    mockFromFn.mockReturnValue(makeChainable())
  })

  it('filters by status = published', async () => {
    await getPostBySlug('test-slug').catch(() => {})
    const builder = mockFromFn.mock.results[0].value
    expect(builder.eq).toHaveBeenCalledWith('status', 'published')
  })

  it('filters by deleted_at IS NULL', async () => {
    await getPostBySlug('test-slug').catch(() => {})
    const builder = mockFromFn.mock.results[0].value
    expect(builder.is).toHaveBeenCalledWith('deleted_at', null)
  })

  it('filters by the given slug', async () => {
    await getPostBySlug('my-post').catch(() => {})
    const builder = mockFromFn.mock.results[0].value
    expect(builder.eq).toHaveBeenCalledWith('slug', 'my-post')
  })
})

describe('getAdminPosts', () => {
  beforeEach(() => {
    mockFromFn.mockReset()
    mockFromFn.mockReturnValue(makeChainable())
  })

  it('does NOT filter by published status (admin sees drafts too)', async () => {
    await getAdminPosts().catch(() => {})
    const builder = mockFromFn.mock.results[0].value
    const statusCalls = (builder.eq.mock.calls as [string, unknown][]).filter(
      ([col]) => col === 'status',
    )
    expect(statusCalls).toHaveLength(0)
  })

  it('filters by deleted_at IS NULL', async () => {
    await getAdminPosts().catch(() => {})
    const builder = mockFromFn.mock.results[0].value
    expect(builder.is).toHaveBeenCalledWith('deleted_at', null)
  })
})

describe('getPostsByTag', () => {
  beforeEach(() => {
    mockFromFn.mockReset()

    // getPostsByTag has two DB calls:
    //   1. from('post_tags').select('post_id').eq('tag_id', tagId)  → returns rows
    //   2. from('posts').select(…).in(…).eq('status','published').is(…).order(…) → returns posts

    // First builder: post_tags
    const postTagsEqResult = {
      then: (resolve: (v: { data: Array<{ post_id: string }>; error: null }) => void) =>
        resolve({ data: [{ post_id: 'some-id' }], error: null }),
    }
    const postTagsBuilder = { select: vi.fn(), eq: vi.fn() }
    postTagsBuilder.select.mockReturnValue(postTagsBuilder)
    postTagsBuilder.eq.mockReturnValue(postTagsEqResult)

    // Second builder: posts (the one with public visibility filters)
    const postsBuilder = makeChainable()
    // `.in()` needs to be on postsBuilder and chainable
    ;(postsBuilder as Record<string, ReturnType<typeof vi.fn>>)['in'] = vi.fn().mockReturnThis()

    mockFromFn
      .mockReturnValueOnce(postTagsBuilder) // from('post_tags')
      .mockReturnValueOnce(postsBuilder)    // from('posts')
  })

  it('filters by status = published', async () => {
    await getPostsByTag('tag-uuid').catch(() => {})
    const postsBuilder = mockFromFn.mock.results[1]?.value
    expect(postsBuilder?.eq).toHaveBeenCalledWith('status', 'published')
  })

  it('filters by deleted_at IS NULL', async () => {
    await getPostsByTag('tag-uuid').catch(() => {})
    const postsBuilder = mockFromFn.mock.results[1]?.value
    expect(postsBuilder?.is).toHaveBeenCalledWith('deleted_at', null)
  })
})
