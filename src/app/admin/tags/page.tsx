import { getAllTagsWithCount } from '@/lib/queries/tags'
import { AdminTagsClient } from '@/components/admin/TagsManager'

export const metadata = { title: 'Tag Management' }

export default async function AdminTagsPage() {
  const tags = await getAllTagsWithCount()

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tags</h1>
        <span className="text-sm text-muted-foreground">{tags.length} total</span>
      </div>

      <AdminTagsClient initialTags={tags} />
    </div>
  )
}
