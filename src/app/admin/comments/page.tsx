import { getPendingComments } from '@/lib/queries/comments'
import { CommentModerationRow } from '@/components/admin/CommentModerationRow'
import { EmptyState } from '@/components/ui/EmptyState'

export const metadata = { title: 'Comment Moderation' }

export default async function AdminCommentsPage() {
  const { data: comments, count } = await getPendingComments()

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Comment Moderation</h1>
        {count > 0 && (
          <span className="text-sm text-muted-foreground">
            {count} pending comment{count === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {comments.length === 0 ? (
        <EmptyState message="No pending comments. The moderation queue is clear!" />
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentModerationRow key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  )
}
