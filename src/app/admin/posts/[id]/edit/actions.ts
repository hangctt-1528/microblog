'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { postSchema } from '@/lib/validations/post'
import { generateSlug } from '@/lib/utils/slug'
import { ensureUniqueSlug } from '@/lib/queries/posts'
import { upsertTagsByNames } from '@/lib/queries/tags'
import type { PostEditorState } from '@/components/admin/PostEditor'

export async function updatePostAction(
  postId: string,
  _prevState: PostEditorState,
  formData: FormData,
): Promise<PostEditorState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { errors: { _form: ['You must be signed in.'] } }
  }

  const raw = {
    title: formData.get('title'),
    body_markdown: formData.get('body_markdown') ?? '',
    slug: formData.get('slug') || undefined,
  }

  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { title, body_markdown, slug: slugOverride } = parsed.data

  // Get current post slug for cache invalidation
  const { data: existing } = await supabase
    .from('posts')
    .select('slug')
    .eq('id', postId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = { title, body_markdown: body_markdown ?? '' }

  if (slugOverride && slugOverride !== existing?.slug) {
    updates.slug = await ensureUniqueSlug(slugOverride, postId)
  }

  const { error } = await supabase.from('posts').update(updates).eq('id', postId)

  if (error) {
    return { errors: { _form: [error.message] } }
  }

  // Replace all tag associations (delete + reinsert)
  const tagNames = formData.getAll('tag_names').map(String).filter(Boolean)
  await supabase.from('post_tags').delete().eq('post_id', postId)
  if (tagNames.length > 0) {
    const tags = await upsertTagsByNames(tagNames)
    await supabase
      .from('post_tags')
      .insert(tags.map((t) => ({ post_id: postId, tag_id: t.id })))
  }

  // Revalidate public cache for old and new slugs
  revalidatePath('/admin/posts')
  revalidatePath('/')
  revalidatePath(`/posts/${existing?.slug ?? ''}`)
  if (updates.slug) revalidatePath(`/posts/${updates.slug}`)

  redirect('/admin/posts')
}
