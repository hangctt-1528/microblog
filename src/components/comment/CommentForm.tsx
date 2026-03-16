'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CommentFormProps {
  postId: string
}

interface FieldErrors {
  post_id?: string[]
  author_name?: string[]
  author_email?: string[]
  body?: string[]
  _form?: string[]
}

export function CommentForm({ postId }: CommentFormProps) {
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setIsPending(true)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          author_name: authorName,
          author_email: authorEmail,
          body,
        }),
      })

      const json = await res.json()

      if (res.status === 201) {
        setSuccess(true)
        setAuthorName('')
        setAuthorEmail('')
        setBody('')
        return
      }

      if (res.status === 422 && json.errors) {
        setErrors(json.errors as FieldErrors)
        return
      }

      // Generic / 404 errors
      setErrors({ _form: [json.error ?? 'Failed to submit comment. Please try again.'] })
    } catch {
      setErrors({ _form: ['Network error. Please check your connection and try again.'] })
    } finally {
      setIsPending(false)
    }
  }

  if (success) {
    return (
      <div
        className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        role="status"
      >
        Your comment is awaiting moderation.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {errors._form && (
        <div
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {errors._form.join('. ')}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="author_name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="author_name"
            name="author_name"
            autoComplete="name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            disabled={isPending}
            aria-describedby={errors.author_name ? 'name-error' : undefined}
          />
          {errors.author_name && (
            <p id="name-error" className="text-sm text-destructive">
              {errors.author_name[0]}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="author_email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="author_email"
            name="author_email"
            type="email"
            autoComplete="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            disabled={isPending}
            aria-describedby={errors.author_email ? 'email-error' : undefined}
          />
          {errors.author_email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.author_email[0]}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Your email will not be published.</p>
        </div>
      </div>

      {/* Comment body */}
      <div className="space-y-1.5">
        <Label htmlFor="comment_body">
          Comment <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="comment_body"
          name="body"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isPending}
          placeholder="Share your thoughts…"
          aria-describedby={errors.body ? 'body-error' : undefined}
        />
        {errors.body && (
          <p id="body-error" className="text-sm text-destructive">
            {errors.body[0]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Submitting…' : 'Post comment'}
      </Button>
    </form>
  )
}
