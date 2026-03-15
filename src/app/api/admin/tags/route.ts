import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { tagSchema } from '@/lib/validations/tag'
import { generateSlug } from '@/lib/utils/slug'

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

  return NextResponse.json({ data: tag }, { status: 201 })
}
