import Link from 'next/link'
import type { Tag } from '@/types'

interface TagBadgeProps {
  tag: Tag
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-2 py-0.5 text-sm transition-colors"
    >
      {tag.name}
    </Link>
  )
}
