import { createClient } from '@/lib/supabase/server'
import type { Comment, CommentWithPost } from '@/types'

/**
 * Returns all approved comments for a post, ordered oldest first.
 * Used on the public post detail page.
 */
export async function getApprovedComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getApprovedComments: ${error.message}`)
  return data ?? []
}

/**
 * Returns pending comments for the CMS moderation queue, paginated.
 * Joins the parent post's title and slug for display.
 *
 * @param page     — 1-based page number (default 1)
 * @param perPage  — items per page (default 20)
 */
export async function getPendingComments(
  page = 1,
  perPage = 20,
): Promise<{ data: CommentWithPost[]; count: number }> {
  const supabase = await createClient()

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, error, count } = await supabase
    .from('comments')
    .select(
      `
        *,
        post:posts(title, slug)
      `,
      { count: 'exact' },
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(`getPendingComments: ${error.message}`)
  return { data: (data as CommentWithPost[]) ?? [], count: count ?? 0 }
}
