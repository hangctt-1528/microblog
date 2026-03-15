import { z } from 'zod'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const postSchema = z.object({
  /** Post headline — required, max 500 chars */
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less'),

  /** Markdown source — defaults to empty string (FR edge case) */
  body_markdown: z.string().default(''),

  /** URL-safe slug — auto-generated from title if omitted */
  slug: z
    .string()
    .regex(slugPattern, 'Slug must be lowercase alphanumeric with hyphens')
    .max(80, 'Slug must be 80 characters or less')
    .optional(),

  /** Tag UUIDs to associate with the post */
  tag_ids: z.array(z.string().uuid('Invalid tag ID')).optional(),
})

export type PostInput = z.infer<typeof postSchema>
