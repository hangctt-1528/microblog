# 🏗️ Architecture & Data Model

## System Architecture

```
Browser
  └── Next.js 15 App Router (Vercel)
        ├── Public RSC Pages  (/  /posts/[slug]  /tags/[slug])
        ├── Admin CMS Pages   (/admin/*)  ← guarded by middleware
        └── API Route Handlers
              ├── POST /api/comments          ← public
              └── /api/admin/*                ← auth-required
                    ├── posts / [id]
                    ├── tags  / [id]
                    └── comments / [id]
  └── Supabase (PostgreSQL + Row Level Security)
        ├── posts, profiles, tags, post_tags, comments
        └── Auth (email/password, auto-create profile trigger)
```

---

## API Routes

### Public API

| Method | Route | Mô tả |
|--------|-------|-------|
| `POST` | `/api/comments` | Gửi bình luận mới (status = pending) |

### Admin API (auth required)

| Method | Route | Mô tả |
|--------|-------|-------|
| `GET` | `/api/admin/posts` | Danh sách tất cả bài viết |
| `POST` | `/api/admin/posts` | Tạo bài viết mới |
| `GET` | `/api/admin/posts/[id]` | Chi tiết một bài viết |
| `PATCH` | `/api/admin/posts/[id]` | Cập nhật bài viết |
| `DELETE` | `/api/admin/posts/[id]` | Xóa bài viết (soft-delete) |
| `GET` | `/api/admin/tags` | Danh sách tags |
| `POST` | `/api/admin/tags` | Tạo tag mới |
| `PATCH` | `/api/admin/tags/[id]` | Cập nhật tag |
| `DELETE` | `/api/admin/tags/[id]` | Xóa tag (safe-delete) |
| `GET` | `/api/admin/comments` | Danh sách bình luận |
| `PATCH` | `/api/admin/comments/[id]` | Cập nhật trạng thái bình luận |

---

## Data Model

```
profiles       posts               tags
───────────    ────────────────    ──────────
id (UUID)      id (UUID)           id (UUID)
name           title               name
email          slug (unique)       slug (unique)
role           body_markdown       created_at
               status
               author_id ──► profiles.id
               published_at        post_tags
               deleted_at          ─────────
               created_at          post_id ─► posts.id
                                   tag_id  ─► tags.id

               comments
               ────────────────
               id (UUID)
               post_id ─► posts.id
               author_name
               author_email
               body
               status: pending | approved | rejected
```

### Bảng `profiles`
| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | Liên kết với `auth.users.id` |
| `name` | text | Tên hiển thị |
| `email` | text | Email |
| `role` | text | `admin` hoặc `user` |

### Bảng `posts`
| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | Primary key |
| `title` | text | Tiêu đề bài viết |
| `slug` | text | URL-friendly identifier (unique) |
| `body_markdown` | text | Nội dung Markdown |
| `status` | text | `draft` \| `published` |
| `author_id` | UUID | FK → `profiles.id` |
| `published_at` | timestamptz | Thời điểm xuất bản |
| `deleted_at` | timestamptz | Soft-delete marker |
| `created_at` | timestamptz | Thời điểm tạo |

### Bảng `tags`
| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | Primary key |
| `name` | text | Tên tag |
| `slug` | text | URL-friendly identifier (unique) |
| `created_at` | timestamptz | Thời điểm tạo |

### Bảng `post_tags` (junction)
| Column | Type | Mô tả |
|--------|------|-------|
| `post_id` | UUID | FK → `posts.id` |
| `tag_id` | UUID | FK → `tags.id` |

### Bảng `comments`
| Column | Type | Mô tả |
|--------|------|-------|
| `id` | UUID | Primary key |
| `post_id` | UUID | FK → `posts.id` |
| `author_name` | text | Tên người bình luận |
| `author_email` | text | Email người bình luận |
| `body` | text | Nội dung bình luận |
| `status` | text | `pending` \| `approved` \| `rejected` |

---

## Row Level Security (RLS)

| Bảng | Ai đọc được | Ai ghi được |
|------|-------------|-------------|
| `posts` | Public (status=published, deleted_at IS NULL) | Admin only |
| `tags` | Public | Admin only |
| `post_tags` | Public | Admin only |
| `comments` | Public (status=approved) / Admin (all) | Public INSERT (pending) / Admin UPDATE |
| `profiles` | Admin only | Admin (own row) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    ← Home timeline (RSC)
│   ├── posts/[slug]/page.tsx       ← Post detail + comments
│   ├── tags/[slug]/page.tsx        ← Tag timeline
│   ├── admin/                      ← CMS (auth-guarded)
│   │   ├── login/
│   │   ├── posts/  new/  [id]/edit/
│   │   ├── tags/
│   │   └── comments/
│   └── api/
│       ├── comments/route.ts       ← Public comment submit
│       └── admin/                  ← Admin REST API
├── components/
│   ├── ui/                         ← shadcn/ui primitives
│   ├── post/PostCard  PostBody
│   ├── tag/TagBadge
│   ├── comment/CommentForm  CommentList
│   └── admin/PostEditor  CommentModerationRow
├── lib/
│   ├── supabase/client.ts  server.ts
│   ├── queries/posts.ts  tags.ts  comments.ts
│   ├── utils/slug.ts  markdown.ts
│   └── validations/post.ts  tag.ts  comment.ts
└── middleware.ts                   ← Auth guard /admin/*
```
