'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { postSchema } from '@/lib/validations/post'
import { generateSlug } from '@/lib/utils/slug'
import { ensureUniqueSlug } from '@/lib/queries/posts'
import type { PostEditorState } from '@/components/admin/PostEditor'

export async function createPostAction(
  _prevState: PostEditorState,
  formData: FormData,
): Promise<PostEditorState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { errors: { _form: ['You must be signed in to create a post.'] } }
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
  const baseSlug = slugOverride || generateSlug(title)
  const slug = await ensureUniqueSlug(baseSlug)

  const { error } = await supabase.from('posts').insert({
    title,
    slug,
    body_markdown: body_markdown ?? '',
    status: 'draft',
    author_id: user.id,
  })

  if (error) {
    return { errors: { _form: [error.message] } }
  }

  revalidatePath('/admin/posts')
  revalidatePath('/')
  redirect('/admin/posts')
}
