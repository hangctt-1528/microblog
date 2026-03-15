import Link from 'next/link'
import { TagBadge } from '@/components/tag/TagBadge'
import type { PostWithTags, Tag } from '@/types'

interface PostCardProps {
  post: PostWithTags
}

/** Strips Markdown syntax to produce a plain-text excerpt */
function stripMarkdown(md: string): string {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '')   // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links → label only
    .replace(/#{1,6}\s+/g, '')         // headings
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // bold / italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // inline code / code blocks
    .replace(/>\s+/g, '')              // blockquotes
    .replace(/[-*+]\s+/g, '')          // list bullets
    .replace(/\n+/g, ' ')             // newlines → space
    .trim()
}

export function PostCard({ post }: PostCardProps) {
  const tags = post.post_tags
    .map((pt) => pt.tag)
    .filter((t): t is Tag => t !== null)

  const excerpt = stripMarkdown(post.body_markdown).slice(0, 160)
  const hasMore = stripMarkdown(post.body_markdown).length > 160

  const formattedDate = post.published_at
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(post.published_at))
    : null

  return (
    <article className="flex flex-col gap-3 py-6 border-b border-border last:border-0">
      {/* Title */}
      <h2 className="text-xl font-semibold leading-snug">
        <Link
          href={`/posts/${post.slug}`}
          className="hover:underline underline-offset-2"
        >
          {post.title}
        </Link>
      </h2>

      {/* Date */}
      {formattedDate && (
        <time
          dateTime={post.published_at!}
          className="text-xs text-muted-foreground"
        >
          {formattedDate}
        </time>
      )}

      {/* Excerpt */}
      {excerpt && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {excerpt}
          {hasMore && '…'}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </article>
  )
}
