import { createClient } from '@/lib/supabase/server'
import type { PostWithTags, PostWithAuthorAndTags, PostStatus } from '@/types'

const POST_WITH_TAGS_SELECT = `
  *,
  post_tags(
    tag:tags(*)
  )
` as const

const POST_WITH_AUTHOR_TAGS_SELECT = `
  *,
  author:profiles(*),
  post_tags(
    tag:tags(*)
  )
` as const

/**
 * Returns all published, non-deleted posts ordered newest first.
 * Used by the public home timeline.
 * ⚠️ Always filters: status = 'published' AND deleted_at IS NULL
 */
export async function getPublishedPosts(): Promise<PostWithTags[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(POST_WITH_TAGS_SELECT)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })

  if (error) throw new Error(`getPublishedPosts: ${error.message}`)
  return (data as PostWithTags[]) ?? []
}

/**
 * Returns a single published, non-deleted post by its slug.
 * Returns null when not found.
 * ⚠️ Always filters: status = 'published' AND deleted_at IS NULL
 */
export async function getPostBySlug(slug: string): Promise<PostWithTags | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(POST_WITH_TAGS_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single()

  if (error) {
    // PGRST116 = "no rows returned" — not an error for us
    if (error.code === 'PGRST116') return null
    throw new Error(`getPostBySlug: ${error.message}`)
  }

  return data as PostWithTags
}

/**
 * Returns all non-deleted posts for the CMS admin area.
 * Includes author profile and tag relationships.
 * No public-facing status/deleted filters applied.
 *
 * @param statusFilter — optional 'draft' | 'published' filter
 */
export async function getAdminPosts(
  statusFilter?: PostStatus,
): Promise<PostWithAuthorAndTags[]> {
  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select(POST_WITH_AUTHOR_TAGS_SELECT)
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) throw new Error(`getAdminPosts: ${error.message}`)
  return (data as PostWithAuthorAndTags[]) ?? []
}

/**
 * Ensures the given base slug is unique in the posts table.
 * Appends -2, -3, … until an unused slug is found.
 *
 * @param baseSlug   — the desired slug (already generated)
 * @param excludeId  — exclude this post ID from the uniqueness check (for edits)
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  const supabase = await createClient()

  const isSlugTaken = async (candidate: string): Promise<boolean> => {
    let query = supabase
      .from('posts')
      .select('id')
      .eq('slug', candidate)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query
    return (data?.length ?? 0) > 0
  }

  if (!(await isSlugTaken(baseSlug))) return baseSlug

  let counter = 2
  while (true) {
    const candidate = `${baseSlug}-${counter}`
    if (!(await isSlugTaken(candidate))) return candidate
    counter++
  }
}
