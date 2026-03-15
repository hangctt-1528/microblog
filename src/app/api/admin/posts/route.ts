import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { postSchema } from '@/lib/validations/post'
import { generateSlug } from '@/lib/utils/slug'
import { ensureUniqueSlug } from '@/lib/queries/posts'
import { upsertTagsByNames } from '@/lib/queries/tags'

// POST /api/admin/posts — create draft post
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { title, body_markdown, slug: slugOverride, tag_ids } = parsed.data

  // Resolve slug: use override if provided, otherwise auto-generate
  const baseSlug = slugOverride || generateSlug(title)
  const slug = await ensureUniqueSlug(baseSlug)

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title,
      slug,
      body_markdown: body_markdown ?? '',
      status: 'draft',
      author_id: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // Unique constraint — slug was taken between check and insert
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sync tags: prefer tag_names (auto-upsert), fall back to tag_ids
  const { tag_names } = parsed.data as typeof parsed.data & { tag_names?: string[] }
  const resolvedTagIds: string[] = []

  if (Array.isArray(tag_names) && tag_names.length > 0) {
    const tags = await upsertTagsByNames(tag_names)
    resolvedTagIds.push(...tags.map((t) => t.id))
  } else if (tag_ids && tag_ids.length > 0) {
    resolvedTagIds.push(...tag_ids)
  }

  if (resolvedTagIds.length > 0) {
    await supabase
      .from('post_tags')
      .insert(resolvedTagIds.map((tag_id) => ({ post_id: post.id, tag_id })))
  }

  revalidatePath('/')
  return NextResponse.json({ data: post }, { status: 201 })
}
