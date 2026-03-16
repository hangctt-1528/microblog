'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function publishPostAction(postId: string, postSlug: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', postId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/posts')
  revalidatePath('/')
  revalidatePath(`/posts/${postSlug}`)
}

export async function unpublishPostAction(postId: string, postSlug: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('posts')
    .update({ status: 'draft', published_at: null })
    .eq('id', postId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/posts')
  revalidatePath('/')
  revalidatePath(`/posts/${postSlug}`)
}

export async function deletePostAction(postId: string, postSlug: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/posts')
  revalidatePath('/')
  revalidatePath(`/posts/${postSlug}`)
}
