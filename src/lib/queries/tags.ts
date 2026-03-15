import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils/slug'
import type { Tag, TagWithCount, PostWithTags } from '@/types'

/**
 * Returns the tag matching the given slug, or null when not found.
 */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getTagBySlug: ${error.message}`)
  }

  return data
}

/**
 * Returns all published, non-deleted posts that carry the given tag.
 * Ordered by published_at descending.
 * ⚠️ Always filters: status = 'published' AND deleted_at IS NULL
 */
export async function getPostsByTag(tagId: string): Promise<PostWithTags[]> {
  const supabase = await createClient()

  // Step 1: find all post IDs associated with this tag
  const { data: postTagRows, error: ptError } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tagId)

  if (ptError) throw new Error(`getPostsByTag (post_tags): ${ptError.message}`)
  if (!postTagRows || postTagRows.length === 0) return []

  const postIds = postTagRows.map((r) => r.post_id)

  // Step 2: fetch those posts with public visibility filters
  const { data, error } = await supabase
    .from('posts')
    .select('*, post_tags(tag:tags(*))')
    .in('id', postIds)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })

  if (error) throw new Error(`getPostsByTag (posts): ${error.message}`)
  return (data as PostWithTags[]) ?? []
}

/**
 * Returns all tags with a denormalised post count.
 * Ordered alphabetically by name.
 */
export async function getAllTagsWithCount(): Promise<TagWithCount[]> {
  const supabase = await createClient()

  const [tagsResult, postTagsResult] = await Promise.all([
    supabase.from('tags').select('*').order('name'),
    supabase.from('post_tags').select('tag_id'),
  ])

  if (tagsResult.error) throw new Error(`getAllTagsWithCount (tags): ${tagsResult.error.message}`)
  if (postTagsResult.error) throw new Error(`getAllTagsWithCount (post_tags): ${postTagsResult.error.message}`)

  const tags = tagsResult.data ?? []
  const postTagRows = postTagsResult.data ?? []

  // Build a count map: tag_id → number of associated posts
  const countMap = new Map<string, number>()
  for (const row of postTagRows) {
    countMap.set(row.tag_id, (countMap.get(row.tag_id) ?? 0) + 1)
  }

  return tags.map((tag) => ({
    ...tag,
    post_count: countMap.get(tag.id) ?? 0,
  }))
}

/**
 * Returns the tag with the given name, creating it if it does not exist.
 * Slug is auto-generated from the name via generateSlug().
 */
export async function getOrCreateTag(name: string): Promise<Tag> {
  const supabase = await createClient()
  const trimmedName = name.trim()

  // Check for an existing tag by name (case-sensitive per DB unique constraint)
  const { data: existing } = await supabase
    .from('tags')
    .select('*')
    .eq('name', trimmedName)
    .single()

  if (existing) return existing

  // Create a new tag with an auto-generated slug
  const slug = generateSlug(trimmedName)

  const { data, error } = await supabase
    .from('tags')
    .insert({ name: trimmedName, slug })
    .select()
    .single()

  if (error) throw new Error(`getOrCreateTag: ${error.message}`)
  return data
}

/**
 * Upserts multiple tags by name, returning the full Tag records.
 * Creates any tags that don't already exist.
 */
export async function upsertTagsByNames(names: string[]): Promise<Tag[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
  return Promise.all(unique.map(getOrCreateTag))
}
