# API Contract: Admin — Tag Management

**Base path**: `/api/admin/tags`  
**Auth**: Required — Supabase session cookie  
**Purpose**: CMS CRUD for tags (FR-020)

---

## `GET /api/admin/tags`

List all tags with post counts.

### Response 200

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Technology",
      "slug": "technology",
      "post_count": 12,
      "created_at": "2026-03-15T09:00:00.000Z"
    }
  ]
}
```

---

## `POST /api/admin/tags`

Create a new tag manually.

### Body Schema

```typescript
{
  name: string  // required, non-empty, max 100 chars, trimmed
  slug?: string // optional override; auto-generated from name if omitted
}
```

### Responses

| Status | Meaning |
|--------|----------|
| `201 Created` | Tag created |
| `409 Conflict` | Name or slug already exists |
| `422 Unprocessable` | Validation error |
| `401 Unauthorized` | No session |

### 201 Body

```json
{
  "data": {
    "id": "uuid",
    "name": "Technology",
    "slug": "technology",
    "created_at": "2026-03-15T09:00:00.000Z"
  }
}
```

---

## `PATCH /api/admin/tags/[id]`

Rename a tag (updates both `name` and `slug`).

### Body Schema

```typescript
{
  name:  string   // required — new display name
  slug?: string   // optional override; auto-generated from new name if omitted
}
```

### Responses

| Status | Meaning |
|--------|----------|
| `200 OK` | Updated tag object |
| `404 Not Found` | Tag does not exist |
| `409 Conflict` | New slug already belongs to another tag |
| `422 Unprocessable` | Validation error |
| `401 Unauthorized` | No session |

---

## `DELETE /api/admin/tags/[id]`

Permanently delete a tag — only when no posts reference it (FR-012).

### Responses

| Status | Meaning |
|--------|----------|
| `204 No Content` | Tag deleted |
| `404 Not Found` | Tag does not exist |
| `409 Conflict` | Tag is still referenced by one or more posts |
| `401 Unauthorized` | No session |

### 409 Body (tag in use)

```json
{
  "error": "Cannot delete tag 'technology': it is referenced by 3 post(s).",
  "post_count": 3
}
```

---

## Implementation Notes

- Tag `name` uniqueness enforced by DB UNIQUE constraint; `409` on duplicate.
- Slug collision on rename: application checks slug availability before update; returns `409` if taken.
- `post_count` in GET is computed via `count(post_tags.tag_id)` join.
- After tag rename, `revalidatePath('/tags/[old-slug]')` and `revalidatePath('/tags/[new-slug]')` are called.
