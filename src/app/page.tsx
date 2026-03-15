import { getPublishedPosts } from '@/lib/queries/posts'
import { PostCard } from '@/components/post/PostCard'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function HomePage() {
  const posts = await getPublishedPosts()

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="sr-only">Latest posts</h1>

      {posts.length === 0 ? (
        <EmptyState message="No posts yet. Check back soon!" />
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  )
}
