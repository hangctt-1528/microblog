import { z } from 'zod'

export const commentSchema = z.object({
  /** UUID of the post being commented on */
  post_id: z.string().uuid('Invalid post ID'),
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
