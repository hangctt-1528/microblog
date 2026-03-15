import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/admin/comments/[id] — approve or reject a pending comment
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

  // Fetch the comment to check current status
  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('id, post_id, status')
    .eq('id', id)
    .single()

  if (fetchError || !comment) {
    return NextResponse.json({ error: 'Comment not found.' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action } = body as Record<string, unknown>

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json(
      { error: 'action must be "approve" or "reject"' },
      { status: 422 },
    )
  }

  // Only allow pending → approved/rejected transitions
  if (comment.status !== 'pending') {
    return NextResponse.json(
      { error: `Comment has already been moderated (status: ${comment.status}).` },
      { status: 409 },
    )
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  const { data: updated, error: updateError } = await supabase
    .from('comments')
    .update({ status: newStatus })
    .eq('id', id)
    .select('id, post_id, status')
    .single()

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Failed to update comment.' },
      { status: 500 },
    )
  }

  // After approval, invalidate the post page so the comment appears immediately
  if (newStatus === 'approved') {
    const { data: post } = await supabase
      .from('posts')
      .select('slug')
      .eq('id', comment.post_id)
      .single()

    if (post?.slug) {
      revalidatePath(`/posts/${post.slug}`)
    }
  }

  return NextResponse.json({ data: updated })
}
