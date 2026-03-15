import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/comments — list comments for the moderation queue
export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'pending'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)))

  const validStatuses = ['pending', 'approved', 'rejected', 'all']
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      { status: 422 },
    )
  }

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('comments')
    .select(
      `
        id,
        post_id,
        author_name,
        author_email,
        body,
        status,
        created_at,
        post:posts(title, slug)
      `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status !== 'all') {
    query = query.eq('status', status as 'pending' | 'approved' | 'rejected')
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten post join into post_title / post_slug for the contract shape
  const rows = (data ?? []).map((c) => {
    const post = c.post as { title: string; slug: string } | null
    return {
      id: c.id,
      post_id: c.post_id,
      post_title: post?.title ?? null,
      post_slug: post?.slug ?? null,
      author_name: c.author_name,
      author_email: c.author_email,
      body: c.body,
      status: c.status,
      created_at: c.created_at,
    }
  })

  return NextResponse.json({
    data: rows,
    meta: { total: count ?? 0, page, per_page: perPage },
  })
}
