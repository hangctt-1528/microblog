import { z } from 'zod'

// Zod 3.25+ enforces strict RFC 4122 UUID (version + variant bits).
// PostgreSQL accepts any 8-4-4-4-12 hex UUID, so we use a relaxed regex.
const uuidLike = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i

export const commentSchema = z.object({
  /** UUID of the post being commented on */
  post_id: z.string().regex(uuidLike, 'Invalid post ID'),
  /** Display name of the comment author */
  author_name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less'),
  /** Email address of the comment author */
  author_email: z.string().email('Invalid email address'),
  /** Comment body text */
  body: z
    .string()
    .min(1, 'Comment body is required')
    .max(5000, 'Comment must be 5000 characters or less'),
})

export type CommentInput = z.infer<typeof commentSchema>
