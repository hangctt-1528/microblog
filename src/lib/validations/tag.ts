import { z } from 'zod'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const tagSchema = z.object({
  /** Display name — non-empty, max 100 chars, whitespace-trimmed */
  name: z
    .string()
    .min(1, 'Tag name is required')
    .max(100, 'Tag name must be 100 characters or less')
    .trim(),

  /** URL-safe slug — auto-generated from name if omitted */
  slug: z
    .string()
    .regex(slugPattern, 'Slug must be lowercase alphanumeric with hyphens')
    .max(80, 'Slug must be 80 characters or less')
    .optional(),
})

export type TagInput = z.infer<typeof tagSchema>
