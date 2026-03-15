# API Contract: Admin — Comment Moderation

**Base path**: `/api/admin/comments`  
**Auth**: Required — Supabase session cookie  
**Purpose**: CMS comment moderation queue: list pending, approve, reject (FR-017, FR-021)

---

## `GET /api/admin/comments`

List comments for the moderation queue.

### Query Parameters

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `status` | `pending` \| `approved` \| `rejected` \| `all` | `pending` | Filter by status |
| `page` | number | `1` | Pagination |
| `per_page` | number | `20` | Max 100 |

### Response 200

```json
{
  "data": [
    {
      "id": "uuid",
      "post_id": "uuid",
      "post_title": "My First Post",
      "post_slug": "my-first-post",
      "author_name": "Alice Reader",
      "author_email": "alice@example.com",
      "body": "Great post!",
      "status": "pending",
      "created_at": "2026-03-15T11:00:00.000Z"
    }
  ],
  "meta": { "total": 7, "page": 1, "per_page": 20 }
}
```

---

## `PATCH /api/admin/comments/[id]`

Approve or reject a single comment.

### Body Schema

```typescript
{
  action: 'approve' | 'reject'
  // 'approve' → status = 'approved'  → comment appears publicly
  // 'reject'  → status = 'rejected'  → comment stays hidden forever
}
```

### Responses

| Status | Meaning |
|--------|----------|
| `200 OK` | Updated comment object |
| `404 Not Found` | Comment does not exist |
| `409 Conflict` | Comment already approved or rejected (not pending) |
| `422 Unprocessable` | `action` not in allowed values |
| `401 Unauthorized` | No session |

### 200 Body

```json
{
  "data": {
    "id": "uuid",
    "post_id": "uuid",
    "status": "approved"
  }
}
```

### 409 Body (already moderated)

```json
{
  "error": "Comment has already been moderated (status: approved)."
}
```

---

## Implementation Notes

- Only `pending` → `approved` or `pending` → `rejected` transitions are valid.
- After approval, `revalidatePath('/posts/[slug]')` is called to invalidate the post page ISR cache.
- `author_email` is included in the moderation list for spam assessment but is NEVER exposed on any public page.
- RLS policy `auth_moderate_comments` enforces that only authenticated users can update comment `status`.
