'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { CommentWithPost } from '@/types'

interface CommentModerationRowProps {
  comment: CommentWithPost
}

export function CommentModerationRow({ comment }: CommentModerationRowProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>(
    comment.status as 'pending' | 'approved' | 'rejected',
  )
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const post = comment.post

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(comment.created_at))

  async function handleAction(action: 'approve' | 'reject') {
    setIsPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Action failed.')
        return
      }

      setStatus(action === 'approve' ? 'approved' : 'rejected')
      // Refresh the RSC page data so the pending count updates
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground">{comment.author_email}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            <time dateTime={comment.created_at}>{formattedDate}</time>
            {post && (
              <>
                {' · on '}
                <Link
                  href={`/posts/${post.slug}`}
                  target="_blank"
                  className="underline-offset-2 hover:underline text-foreground"
                >
                  {post.title}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Status badge */}
        {status === 'approved' && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            Approved
          </span>
        )}
        {status === 'rejected' && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            Rejected
          </span>
        )}
      </div>

      {/* Comment body */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
        {comment.body}
      </p>

      {/* Error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Action buttons — only when still pending */}
      {status === 'pending' && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => handleAction('approve')}
          >
            {isPending ? '…' : 'Approve'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => handleAction('reject')}
          >
            {isPending ? '…' : 'Reject'}
          </Button>
        </div>
      )}
    </div>
  )
}
