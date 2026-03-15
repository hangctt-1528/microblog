import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPostBySlug } from '@/lib/queries/posts'
import { getApprovedComments } from '@/lib/queries/comments'
import { renderMarkdown } from '@/lib/utils/markdown'
import { PostBody } from '@/components/post/PostBody'
import { TagBadge } from '@/components/tag/TagBadge'
import { CommentList } from '@/components/comment/CommentList'
import { CommentForm } from '@/components/comment/CommentForm'
import type { Tag } from '@/types'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return { title: 'Post not found' }
  }

  const description = post.body_markdown.slice(0, 160).replace(/[#*`_>]/g, '').trim()

  return {
    title: post.title,
    description,
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  // notFound for missing posts or soft-deleted posts
  if (!post || post.deleted_at !== null) {
    notFound()
  }

  const [html, comments] = await Promise.all([
    renderMarkdown(post.body_markdown),
    getApprovedComments(post.id),
  ])

  const tags = post.post_tags
    .map((pt) => pt.tag)
    .filter((t): t is Tag => t !== null)

  const formattedDate = post.published_at
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(post.published_at))
    : null

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <article>
        {/* Post header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold leading-tight mb-3">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-3">
            {formattedDate && (
              <time
                dateTime={post.published_at!}
                className="text-sm text-muted-foreground"
              >
                {formattedDate}
              </time>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Post body */}
        <PostBody html={html} />
      </article>

      {/* Comments section */}
      <section className="mt-12 border-t border-border pt-10" aria-label="Comments">
        <h2 className="text-xl font-semibold mb-6">
          {comments.length === 0
            ? 'Comments'
            : `${comments.length} Comment${comments.length === 1 ? '' : 's'}`}
        </h2>

        <CommentList comments={comments} />

        <div className="mt-10">
          <h3 className="text-base font-semibold mb-4">Leave a comment</h3>
          <CommentForm postId={post.id} />
        </div>
      </section>
    </main>
  )
}
