# API Contract: Public Comment Submission

**Endpoint**: `POST /api/comments`  
**Auth**: None (public — no authentication required, FR-013)  
**Purpose**: Submit a reader comment on a published post

---

## Request

```http
POST /api/comments
Content-Type: application/json
```

### Body Schema

```typescript
{
  post_id:      string  // UUID of the target post (required)
  author_name:  string  // Commenter's display name (required, non-empty)
  author_email: string  // Commenter's email — validated format, not displayed publicly (required)
  body:         string  // Comment text (required, non-empty)
}
```

### Example

```json
{
  "post_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "author_name": "Alice Reader",
  "author_email": "alice@example.com",
  "body": "Great post! Really enjoyed the section on deployment."
}
```

---

## Validation (server-side — FR-014)

| Field | Rule | Error |
|-------|------|-------|
| `post_id` | Valid UUID; post must exist, be `published`, and have `deleted_at IS NULL` | 404 if post not found/deleted; 422 if invalid UUID |
| `author_name` | Non-empty string, max 200 chars | 422 |
| `author_email` | Valid email format (`z.string().email()`) | 422 |
| `body` | Non-empty string, max 5000 chars | 422 |

**Important**: `status` is NEVER accepted from the client. Server always sets `status = 'pending'`.

---

## Responses

### 201 Created

```json
{
  "data": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "post_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "pending",
    "created_at": "2026-03-15T10:00:00.000Z"
  },
  "message": "Your comment is awaiting moderation."
}
```

### 404 Not Found — post deleted or not published

```json
{
  "error": "Post not found."
}
```

### 422 Unprocessable Entity — validation failure

```json
{
  "error": "Validation failed.",
  "details": {
    "author_email": ["Invalid email format."],
    "body": ["Body is required."]
  }
}
```

### 500 Internal Server Error

```json
{
  "error": "An unexpected error occurred."
}
```

---

## Implementation Notes

- Uses `createServerClient` from `@supabase/ssr` (server-side, no auth context needed for public insert).
- RLS policy `public_insert_comment` enforces `status = 'pending'` at DB level (defence in depth).
- Rate limiting: Vercel Edge Middleware can add IP-based throttle if spam becomes an issue (future).
