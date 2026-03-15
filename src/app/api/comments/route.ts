import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { commentSchema } from '@/lib/validations/comment'

// POST /api/comments — submit a reader comment on a published post
export async function POST(request: Request) {
  const supabase = await createClient()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { post_id, author_name, author_email, body: commentBody } = parsed.data

  // Verify post exists, is published, and is not soft-deleted
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, status, deleted_at')
    .eq('id', post_id)
    .single()

  if (postError || !post || post.status !== 'published' || post.deleted_at !== null) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  // Insert comment with status = 'pending' (never from client input)
  const { data: comment, error: insertError } = await supabase
    .from('comments')
    .insert({
      post_id,
      author_name,
      author_email,
      body: commentBody,
      status: 'pending',
    })
    .select('id, post_id, status, created_at')
    .single()

  if (insertError || !comment) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to submit comment.' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      data: comment,
      message: 'Your comment is awaiting moderation.',
    },
    { status: 201 },
  )
}
