import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { tagSchema } from '@/lib/validations/tag'
import { generateSlug } from '@/lib/utils/slug'

// PATCH /api/admin/tags/[id] — rename a tag (name + slug update)
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

  // Verify tag exists
  const { data: existing, error: fetchError } = await supabase
    .from('tags')
    .select('id, name, slug')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Tag not found.' }, { status: 404 })
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
  const newSlug = slugOverride || generateSlug(name)

  // Check new slug isn't already taken by a different tag
  if (newSlug !== existing.slug) {
    const { data: conflict } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', newSlug)
      .neq('id', id)
      .single()

    if (conflict) {
      return NextResponse.json(
        { error: `Slug "${newSlug}" is already used by another tag.` },
        { status: 409 },
      )
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('tags')
    .update({ name, slug: newSlug })
    .eq('id', id)
    .select()
    .single()

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Failed to update tag.' },
      { status: 500 },
    )
  }

  // Invalidate both old and new slug tag pages
  revalidatePath(`/tags/${existing.slug}`)
  revalidatePath(`/tags/${newSlug}`)
  revalidatePath('/admin/tags')

  return NextResponse.json({ data: updated })
}

// DELETE /api/admin/tags/[id] — permanently delete (only when no posts use it)
export async function DELETE(
  _request: Request,
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

  // Verify tag exists
  const { data: existing, error: fetchError } = await supabase
    .from('tags')
    .select('id, slug')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Tag not found.' }, { status: 404 })
  }

  // Check for active post associations (FR-012)
  const { count } = await supabase
    .from('post_tags')
    .select('*', { count: 'exact', head: true })
    .eq('tag_id', id)

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete this tag — it is used by ${count} post${count === 1 ? '' : 's'}. Remove the tag from all posts first.`,
      },
      { status: 409 },
    )
  }

  const { error: deleteError } = await supabase.from('tags').delete().eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  revalidatePath(`/tags/${existing.slug}`)
  revalidatePath('/admin/tags')

  return new Response(null, { status: 204 })
}
