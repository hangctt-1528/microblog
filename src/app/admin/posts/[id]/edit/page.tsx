import { notFound } from 'next/navigation'
import { getAdminPostById } from '@/lib/queries/posts'
import { getAllTagsWithCount } from '@/lib/queries/tags'
import { PostEditor } from '@/components/admin/PostEditor'
import { updatePostAction } from './actions'
import type { Tag } from '@/types'

type Props = {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Edit Post' }

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const [post, availableTags] = await Promise.all([
    getAdminPostById(id),
    getAllTagsWithCount(),
  ])

  if (!post) notFound()

  // Extract tag names from the post's joined tags
  const initialTagNames = post.post_tags
    .map((pt) => (pt.tag as Tag | null)?.name)
    .filter((n): n is string => Boolean(n))

  // Bind the post ID to the Server Action (Next.js canonical pattern)
  const boundAction = updatePostAction.bind(null, id)

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Post</h1>
      <PostEditor
        action={boundAction}
        initialData={{
          title: post.title,
          slug: post.slug,
          body_markdown: post.body_markdown,
          initialTagNames,
        }}
        availableTags={availableTags}
        submitLabel="Save changes"
      />
    </div>
  )
}
