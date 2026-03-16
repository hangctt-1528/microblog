import type { Comment } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'

interface CommentListProps {
  comments: Comment[]
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return <EmptyState message="No comments yet. Be the first to share your thoughts!" />
  }

  return (
    <ol className="space-y-6">
      {comments.map((comment) => {
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(comment.created_at))

        return (
          <li key={comment.id} className="flex gap-3">
            {/* Avatar placeholder */}
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold select-none"
              aria-hidden
            >
              {comment.author_name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                <span className="font-medium text-sm">{comment.author_name}</span>
                <time
                  dateTime={comment.created_at}
                  className="text-xs text-muted-foreground"
                >
                  {formattedDate}
                </time>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {comment.body}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
