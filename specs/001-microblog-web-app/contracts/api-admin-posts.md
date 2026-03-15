# API Contract: Admin — Post Management

**Base path**: `/api/admin/posts`  
**Auth**: Required — Supabase session cookie (all routes protected by `middleware.ts`)  
**Purpose**: CMS CRUD for posts (FR-019)

---

## `GET /api/admin/posts`

List all non-deleted posts for the CMS (drafts + published).

### Query Parameters

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `status` | `draft` \| `published` \| `all` | `all` | Filter by status |
| `page` | number | `1` | Pagination |
| `per_page` | number | `20` | Max 100 |

### Response 200

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "My First Post",
      "slug": "my-first-post",
      "status": "published",
      "author": { "id": "uuid", "name": "Jane Author" },
      "tags": [{ "id": "uuid", "name": "Tech", "slug": "tech" }],
      "created_at": "2026-03-15T09:00:00.000Z",
      "published_at": "2026-03-15T10:00:00.000Z",
      "deleted_at": null
    }
  ],
  "meta": { "total": 42, "page": 1, "per_page": 20 }
}
```

---

## `POST /api/admin/posts`

Create a new post (saved as draft by default — FR-002).

### Body Schema

```typescript
{
  title:         string   // required, non-empty, max 500 chars
  body_markdown: string   // optional, defaults to ""
  slug?:         string   // optional override; auto-generated if omitted
  tag_ids?:      string[] // UUIDs of existing tags; empty array allowed
}
```

### Responses

| Status | Meaning |
|--------|----------|
| `201 Created` | Post created; body contains the new post object |
| `409 Conflict` | Slug already exists (with auto-suffix suggestion in response) |
| `422 Unprocessable` | Validation error |
| `401 Unauthorized` | No valid session |

### 201 Body

```json
{
  "data": {
    "id": "uuid",
    "title": "New Post",
    "slug": "new-post",
    "status": "draft",
    "body_markdown": "# Hello",
    "author_id": "uuid",
    "created_at": "2026-03-15T10:00:00.000Z",
    "published_at": null,
    "deleted_at": null,
    "tags": []
  }
}
```

---

## `PATCH /api/admin/posts/[id]`

Update a post. Handles: edit content, publish, unpublish, soft-delete.

### Body Schema

```typescript
{
  title?:         string
  body_markdown?: string
  slug?:          string
  tag_ids?:       string[]
  action?:        'publish' | 'unpublish' | 'delete'
  // "publish"   → status = 'published', published_at = now()
  // "unpublish" → status = 'draft',     published_at = null
  // "delete"    → deleted_at = now()    (soft-delete — FR-005)
}
```

**Note**: `action` and field edits MAY be sent in the same request.

### State Machine

```
draft ──── action:'publish' ────► published  (sets published_at)
published ─ action:'unpublish' ─► draft      (clears published_at)
any ──────── action:'delete' ───► deleted_at set (status unchanged)
```

### Responses

| Status | Meaning |
|--------|----------|
| `200 OK` | Updated post object returned |
| `404 Not Found` | Post does not exist or `deleted_at IS NOT NULL` |
| `409 Conflict` | Slug already taken by another post |
| `422 Unprocessable` | Validation error |
| `401 Unauthorized` | No valid session |
| `403 Forbidden` | Author trying to edit another author's post (non-admin) |

---

## `DELETE /api/admin/posts/[id]`

> **Deprecated convenience alias** — prefer `PATCH` with `action:'delete'`.  
> Hard-delete is strictly forbidden (constitution). This route performs soft-delete.

### Response 200

```json
{ "data": { "id": "uuid", "deleted_at": "2026-03-15T10:05:00.000Z" } }
```

---

## Implementation Notes

- All handlers call `createClient()` from `lib/supabase/server.ts` — session validated by `middleware.ts` before handler runs.
- `author_id` is set to `session.user.id` on create — never accepted from client.
- Slug uniqueness: on collision, application appends `-2`, `-3`, … and returns `409` if the auto-generated suffixed slug is also taken.
- Tag sync: on PATCH with `tag_ids`, handler deletes all existing `post_tags` rows for the post and inserts the new set (replace strategy).
- After publish/unpublish/delete, call `revalidatePath('/')` and `revalidatePath('/posts/[slug]')` for ISR cache invalidation.
