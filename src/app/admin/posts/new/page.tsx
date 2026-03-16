import { getAllTagsWithCount } from '@/lib/queries/tags'
import { PostEditor } from '@/components/admin/PostEditor'
import { createPostAction } from './actions'

export const metadata = { title: 'New Post' }

export default async function NewPostPage() {
  const availableTags = await getAllTagsWithCount()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">New Post</h1>
      <PostEditor
        action={createPostAction}
        availableTags={availableTags}
        submitLabel="Save draft"
      />
    </div>
  )
}
