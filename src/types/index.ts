import type { Database } from './database.types'

// ── Row types ─────────────────────────────────────
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post    = Database['public']['Tables']['posts']['Row']
export type Tag     = Database['public']['Tables']['tags']['Row']
export type PostTag = Database['public']['Tables']['post_tags']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']

// ── Insert types ──────────────────────────────────
export type PostInsert    = Database['public']['Tables']['posts']['Insert']
export type TagInsert     = Database['public']['Tables']['tags']['Insert']
export type CommentInsert = Database['public']['Tables']['comments']['Insert']

// ── Update types ──────────────────────────────────
export type PostUpdate    = Database['public']['Tables']['posts']['Update']
export type TagUpdate     = Database['public']['Tables']['tags']['Update']
export type CommentUpdate = Database['public']['Tables']['comments']['Update']

// ── Joined / enriched types ───────────────────────

/** Post with its tag relationships (for public pages) */
export type PostWithTags = Post & {
  post_tags: Array<{ tag: Tag | null }>
}

/** Post with author profile and tags (for CMS admin pages) */
export type PostWithAuthorAndTags = Post & {
  author: Profile | null
  post_tags: Array<{ tag: Tag | null }>
}

/** Tag with denormalised post count (for CMS tag list) */
export type TagWithCount = Tag & {
  post_count: number
}

/** Comment joined with its parent post's title and slug */
export type CommentWithPost = Comment & {
  post: Pick<Post, 'title' | 'slug'> | null
}

// ── Domain enums ──────────────────────────────────
export type PostStatus    = Post['status']
export type CommentStatus = Comment['status']
export type ProfileRole   = Profile['role']
