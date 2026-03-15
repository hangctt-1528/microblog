'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { TagWithCount } from '@/types'

interface TagRowProps {
  tag: TagWithCount
}

function TagRow({ tag }: TagRowProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState(tag.name)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRename() {
    if (newName.trim() === tag.name) {
      setEditing(false)
      return
    }
    setIsPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tags/${tag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Rename failed.')
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      setError('Network error.')
    } finally {
      setIsPending(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete tag "${tag.name}"? This cannot be undone.`)) return
    setIsPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tags/${tag.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Delete failed.')
        return
      }
      router.refresh()
    } catch {
      setError('Network error.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <tr className="bg-background hover:bg-muted/30 transition-colors border-b border-border last:border-0">
      <td className="px-4 py-3">
        {editing ? (
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') { setEditing(false); setNewName(tag.name) }
            }}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <span className="font-medium text-sm">{tag.name}</span>
        )}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{tag.slug}</td>
      <td className="px-4 py-3 text-sm text-center">{tag.post_count}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {editing ? (
            <>
              <Button size="sm" disabled={isPending} onClick={handleRename}>
                {isPending ? '…' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditing(false); setNewName(tag.name); setError(null) }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Rename
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending || tag.post_count > 0}
                title={tag.post_count > 0 ? `Used by ${tag.post_count} post${tag.post_count === 1 ? '' : 's'} — remove from posts first` : 'Delete tag'}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

interface CreateTagFormProps {
  onCreated: () => void
}

function CreateTagForm({ onCreated }: CreateTagFormProps) {
  const [name, setName] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsPending(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? json.errors?.name?.[0] ?? 'Failed to create tag.')
        return
      }
      setName('')
      onCreated()
    } catch {
      setError('Network error.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <Input
          placeholder="New tag name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
        {isPending ? 'Creating…' : 'Create Tag'}
      </Button>
    </form>
  )
}

interface AdminTagsClientProps {
  initialTags: TagWithCount[]
}

export function AdminTagsClient({ initialTags }: AdminTagsClientProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <CreateTagForm onCreated={() => router.refresh()} />

      {initialTags.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No tags yet. Create your first one above.
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Slug</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Posts</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialTags.map((tag) => (
                <TagRow key={tag.id} tag={tag} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
