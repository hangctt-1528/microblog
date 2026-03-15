import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { postSchema } from '@/lib/validations/post'
import { generateSlug } from '@/lib/utils/slug'
import { ensureUniqueSlug } from '@/lib/queries/posts'

// PATCH /api/admin/posts/[id] — edit, publish, unpublish, or soft-delete
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify post exists and is not hard-deleted
  const { data: existing, error: fetchError } = await supabase
    .from('posts')
    .select('id, slug, status, author_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    action,
    title,
    body_markdown,
    slug: slugOverride,
    tag_ids,
  } = body as Record<string, unknown>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {}

  // Content edits
  if (typeof title === 'string') {
    const parsed = postSchema.shape.title.safeParse(title)
    if (!parsed.success) {
      return NextResponse.json({ errors: { title: parsed.error.format()._errors } }, { status: 422 })
    }
    updates.title = parsed.data
  }

  if (typeof body_markdown === 'string') {
    updates.body_markdown = body_markdown
  }

  if (typeof slugOverride === 'string' && slugOverride !== existing.slug) {
    const uniqueSlug = await ensureUniqueSlug(generateSlug(slugOverride), id)
    updates.slug = uniqueSlug
  }

  // Action transitions
  if (action === 'publish') {
    updates.status = 'published'
    updates.published_at = new Date().toISOString()
  } else if (action === 'unpublish') {
    updates.status = 'draft'
    updates.published_at = null
  } else if (action === 'delete') {
    updates.deleted_at = new Date().toISOString()
  }

  const { data: updated, error: updateError } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Sync tags if provided
  if (Array.isArray(tag_ids)) {
    await supabase.from('post_tags').delete().eq('post_id', id)
    if (tag_ids.length > 0) {
      await supabase
        .from('post_tags')
        .insert((tag_ids as string[]).map((tag_id) => ({ post_id: id, tag_id })))
    }
  }

  // Revalidate public cache
  const slugToInvalidate = updates.slug ?? existing.slug
  revalidatePath('/')
  revalidatePath(`/posts/${slugToInvalidate}`)
  if (action === 'delete' || action === 'unpublish') {
    revalidatePath(`/posts/${existing.slug}`)
  }

  return NextResponse.json({ data: updated }, { status: 200 })
}
