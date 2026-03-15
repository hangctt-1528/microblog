import Link from 'next/link'
import { getAdminPosts } from '@/lib/queries/posts'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { publishPostAction } from './actions'

export const metadata = { title: 'Posts' }

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

export default async function AdminPostsPage() {
  const posts = await getAdminPosts()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Link href="/admin/posts/new" className={cn(buttonVariants())}>
          New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <EmptyState message="No posts yet. Create your first one!" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Published</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => (
                <tr key={post.id} className="bg-background hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium line-clamp-1">{post.title}</span>
                    <span className="text-xs text-muted-foreground block mt-0.5">/posts/{post.slug}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge
                      variant={post.status === 'published' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {post.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {formatDate(post.published_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === 'draft' && (
                        <form
                          action={async () => {
                            'use server'
                            await publishPostAction(post.id, post.slug)
                          }}
                        >
                          <Button type="submit" size="sm">
                            Publish
                          </Button>
                        </form>
                      )}
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
