import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { tagSchema } from '@/lib/validations/tag'
import { generateSlug } from '@/lib/utils/slug'

// GET /api/admin/tags — list all tags with post counts, sorted by name
export async function GET(_request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [tagsResult, postTagsResult] = await Promise.all([
    supabase.from('tags').select('*').order('name'),
    supabase.from('post_tags').select('tag_id'),
  ])

  if (tagsResult.error) {
    return NextResponse.json({ error: tagsResult.error.message }, { status: 500 })
  }

  const tags = tagsResult.data ?? []
  const postTagRows = postTagsResult.data ?? []

  const countMap = new Map<string, number>()
  for (const row of postTagRows) {
    countMap.set(row.tag_id, (countMap.get(row.tag_id) ?? 0) + 1)
  }

  const data = tags.map((t) => ({ ...t, post_count: countMap.get(t.id) ?? 0 }))

  return NextResponse.json({ data })
}

// POST /api/admin/tags — create a new tag
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

  const parsed = tagSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { name, slug: slugOverride } = parsed.data
  const slug = slugOverride || generateSlug(name)

  const { data: tag, error } = await supabase
    .from('tags')
    .insert({ name, slug })
    .select()
    .single()

  if (error) {
    // 23505 = unique_violation — name or slug already taken
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A tag with this name or slug already exists.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/admin/tags')
  return NextResponse.json({ data: tag }, { status: 201 })
}
