import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTagBySlug } from '@/lib/queries/tags'
import { getPostsByTag } from '@/lib/queries/tags'
import { PostCard } from '@/components/post/PostCard'
import { EmptyState } from '@/components/ui/EmptyState'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tag = await getTagBySlug(slug)

  if (!tag) {
    return { title: 'Tag not found' }
  }

  return {
    title: `Posts tagged "${tag.name}"`,
    description: `Browse all posts tagged with ${tag.name}.`,
  }
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params
  const tag = await getTagBySlug(slug)

  if (!tag) {
    notFound()
  }

  const posts = await getPostsByTag(tag.id)

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">Tag</p>
        <h1 className="text-2xl font-bold">{tag.name}</h1>
      </header>

      {posts.length === 0 ? (
        <EmptyState message={`No published posts tagged "${tag.name}" yet.`} />
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
