'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { generateSlug } from '@/lib/utils/slug'
import { renderMarkdown } from '@/lib/utils/markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type PostEditorState = {
  errors?: {
    title?: string[]
    slug?: string[]
    body_markdown?: string[]
    _form?: string[]
  }
  message?: string
} | null

export interface PostEditorInitialData {
  title?: string
  slug?: string
  body_markdown?: string
  tag_ids?: string[]
}

interface PostEditorProps {
  /** Server Action — receives (prevState, formData) => PostEditorState */
  action: (prevState: PostEditorState, formData: FormData) => Promise<PostEditorState>
  initialData?: PostEditorInitialData
  cancelHref?: string
  submitLabel?: string
}

export function PostEditor({
  action,
  initialData,
  cancelHref = '/admin/posts',
  submitLabel = 'Save draft',
}: PostEditorProps) {
  const [state, formAction, isPending] = useActionState(action, null)

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!!initialData?.slug)
  const [body, setBody] = useState(initialData?.body_markdown ?? '')
  const [previewHtml, setPreviewHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Auto-generate slug from title unless the user has manually edited it
  useEffect(() => {
    if (!slugTouched) {
      setSlug(generateSlug(title))
    }
  }, [title, slugTouched])

  // Regenerate live preview whenever body or preview tab changes
  useEffect(() => {
    if (!showPreview) return
    let cancelled = false
    renderMarkdown(body).then((html) => {
      if (!cancelled) setPreviewHtml(html)
    })
    return () => { cancelled = true }
  }, [body, showPreview])

  return (
    <form action={formAction} className="space-y-6">
      {/* Form-level error */}
      {state?.errors?._form && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {state.errors._form.join('. ')}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={500}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          aria-describedby={state?.errors?.title ? 'title-error' : undefined}
        />
        {state?.errors?.title && (
          <p id="title-error" className="text-sm text-destructive">
            {state.errors.title[0]}
          </p>
        )}
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value)
            setSlugTouched(true)
          }}
          placeholder="auto-generated-from-title"
          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          maxLength={80}
          aria-describedby="slug-hint"
        />
        <p id="slug-hint" className="text-xs text-muted-foreground">
          URL: <code>/posts/{slug || '…'}</code>
        </p>
        {state?.errors?.slug && (
          <p className="text-sm text-destructive">{state.errors.slug[0]}</p>
        )}
      </div>

      {/* Body / Preview toggle */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="body_markdown">Content (Markdown)</Label>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPreview ? '← Edit' : 'Preview →'}
          </button>
        </div>

        {showPreview ? (
          <div
            className="min-h-48 rounded-md border border-input bg-muted/30 px-3 py-2 prose prose-slate max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: previewHtml || '<em class="text-muted-foreground">Nothing to preview yet.</em>' }}
          />
        ) : (
          <Textarea
            id="body_markdown"
            name="body_markdown"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your post in Markdown…"
            className="min-h-64 font-mono text-sm"
            aria-describedby={state?.errors?.body_markdown ? 'body-error' : undefined}
          />
        )}
        {/* Hidden input keeps the value when preview is shown */}
        {showPreview && (
          <input type="hidden" name="body_markdown" value={body} />
        )}
        {state?.errors?.body_markdown && (
          <p id="body-error" className="text-sm text-destructive">
            {state.errors.body_markdown[0]}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
