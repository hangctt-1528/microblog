# Data Model: Microblog Web App

**Feature**: `001-microblog-web-app`  
**Date**: 2026-03-15  
**Storage**: Supabase (PostgreSQL 15)  
**Migration path**: `supabase/migrations/`

---

## Entities & Relationships

```
User ─────────────────── owns ──────────────────► Post
                                                    │
                                              M:N via PostTag
                                                    │
Tag ◄───────────────── labels ───────────────────── │
                                                    │
                                              1:N (post_id)
                                                    │
                                                 Comment
```

---

## 1. `users` (managed by Supabase Auth)

> Supabase Auth provides the `auth.users` table automatically.  
> A `public.profiles` view/table mirrors the subset needed by the app.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, FK → `auth.users(id)` | Matches Supabase auth UID |
| `name` | `text` | NOT NULL | Display name |
| `email` | `text` | NOT NULL, UNIQUE | Synced from auth |
| `role` | `text` | NOT NULL, CHECK IN (`admin`,`author`) | Default `author` |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

**RLS**:
- Authenticated users can read their own profile.
- Service role (server-only) can read all profiles (for CMS author display).

---

## 2. `posts`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `title` | `text` | NOT NULL, CHECK length > 0 | |
| `slug` | `text` | NOT NULL, UNIQUE | URL-safe; auto-generated from title |
| `body_markdown` | `text` | NOT NULL, DEFAULT '' | Allows empty body (FR edge case) |
| `status` | `text` | NOT NULL, CHECK IN (`draft`,`published`), DEFAULT `draft` | |
| `author_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE RESTRICT | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `published_at` | `timestamptz` | NULLABLE | Set when status → published |
| `deleted_at` | `timestamptz` | NULLABLE | Soft-delete timestamp |

**Indexes**:
- `posts_status_deleted_published_idx` ON `(status, deleted_at, published_at DESC)` — public timeline query
- `posts_slug_idx` ON `(slug)` — unique lookup
- `posts_author_id_idx` ON `(author_id)` — CMS list by author

**State Transitions**:
```
draft ──publish──► published
published ──unpublish──► draft
any ──soft-delete──► deleted_at IS NOT NULL  (status unchanged)
```

**RLS Policies**:
```sql
-- Public: only published, non-deleted
create policy "public_read_posts" on public.posts
  for select using (status = 'published' and deleted_at is null);

-- Authors: full access to own posts (CMS)
create policy "author_manage_own_posts" on public.posts
  for all using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Admins: full access to all posts
create policy "admin_manage_all_posts" on public.posts
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

**Validation Rules**:
- `title`: non-empty string, max 500 chars
- `slug`: 1-80 chars, pattern `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`; unique enforced by DB
- `body_markdown`: any string (empty allowed per spec edge case)
- `status`: exactly `draft` or `published`
- Duplicate slug → append `-2`, `-3`, … (application layer)

---

## 3. `tags`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `name` | `text` | NOT NULL, UNIQUE | Display name |
| `slug` | `text` | NOT NULL, UNIQUE | URL-safe; auto-generated from name |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

**Indexes**:
- `tags_slug_idx` ON `(slug)` — tag page lookup
- `tags_name_idx` ON `(name)` — auto-create lookup by name

**RLS Policies**:
```sql
-- Public: anyone can read tags
create policy "public_read_tags" on public.tags
  for select using (true);

-- Authenticated: create tags (auto-create on post tag input)
create policy "auth_create_tags" on public.tags
  for insert with check (auth.uid() is not null);

-- Admin/Author: manage tags
create policy "auth_manage_tags" on public.tags
  for update using (auth.uid() is not null);
```

**Validation Rules**:
- `name`: non-empty, max 100 chars, trimmed
- `slug`: auto-generated from name; unique enforced by DB
- Slug collision on rename → reject with validation error (FR)
- Cannot delete tag referenced by any `post_tags` row (FK constraint + app-layer check)

---

## 4. `post_tags` (junction)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `post_id` | `uuid` | NOT NULL, FK → `posts(id)` ON DELETE CASCADE | |
| `tag_id` | `uuid` | NOT NULL, FK → `tags(id)` ON DELETE RESTRICT | |

**Primary Key**: `(post_id, tag_id)` — composite

**Rationale for ON DELETE RESTRICT on tag_id**: prevents tag deletion when in
use, enforcing FR-012 at the database level.

**RLS Policies**:
```sql
create policy "public_read_post_tags" on public.post_tags
  for select using (true);

create policy "auth_manage_post_tags" on public.post_tags
  for all using (auth.uid() is not null);
```

---

## 5. `comments`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `post_id` | `uuid` | NOT NULL, FK → `posts(id)` ON DELETE CASCADE | |
| `author_name` | `text` | NOT NULL, CHECK length > 0 | |
| `author_email` | `text` | NOT NULL, CHECK valid email format | |
| `body` | `text` | NOT NULL, CHECK length > 0 | |
| `status` | `text` | NOT NULL, CHECK IN (`pending`,`approved`,`rejected`), DEFAULT `pending` | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

**Indexes**:
- `comments_post_id_status_idx` ON `(post_id, status)` — public approved fetch
- `comments_status_idx` ON `(status)` — CMS moderation queue

**RLS Policies**:
```sql
-- Public: only approved comments on published posts
create policy "public_read_approved_comments" on public.comments
  for select using (status = 'approved');

-- Public: anyone can insert a pending comment
create policy "public_insert_comment" on public.comments
  for insert with check (status = 'pending');

-- Authenticated: moderate comments (update status)
create policy "auth_moderate_comments" on public.comments
  for update using (auth.uid() is not null)
  with check (status in ('approved', 'rejected'));
```

**Validation Rules** (enforced server-side in Route Handler — FR-014):
- `author_name`: non-empty string, max 200 chars
- `author_email`: valid RFC 5322 format (`z.string().email()` in Zod)
- `body`: non-empty string, max 5000 chars
- `status` on insert: MUST be `pending` — application layer sets this, never from client input
- Cannot submit comment on post with `deleted_at IS NOT NULL` or `status != 'published'`

---

## Migration Files

### `20260315000001_initial_schema.sql`

```sql
-- Enable UUID extension
create extension if not exists "pgcrypto";

-- profiles (mirrors auth.users subset)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null unique,
  role       text not null default 'author'
               check (role in ('admin', 'author')),
  created_at timestamptz not null default now()
);

-- posts
create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(title) > 0),
  slug           text not null unique
                   check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  body_markdown  text not null default '',
  status         text not null default 'draft'
                   check (status in ('draft', 'published')),
  author_id      uuid not null references public.profiles(id)
                   on delete restrict,
  created_at     timestamptz not null default now(),
  published_at   timestamptz,
  deleted_at     timestamptz
);

create index posts_status_deleted_published_idx
  on public.posts(status, deleted_at, published_at desc);
create index posts_slug_idx on public.posts(slug);
create index posts_author_id_idx on public.posts(author_id);

-- tags
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique
               check (char_length(name) > 0 and char_length(name) <= 100),
  slug       text not null unique
               check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create index tags_slug_idx on public.tags(slug);
create index tags_name_idx on public.tags(name);

-- post_tags (junction)
create table public.post_tags (
  post_id uuid not null references public.posts(id)  on delete cascade,
  tag_id  uuid not null references public.tags(id)   on delete restrict,
  primary key (post_id, tag_id)
);

create index post_tags_tag_id_idx on public.post_tags(tag_id);

-- comments
create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  author_name  text not null check (char_length(author_name) > 0),
  author_email text not null
                 check (author_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  body         text not null check (char_length(body) > 0),
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now()
);

create index comments_post_id_status_idx on public.comments(post_id, status);
create index comments_status_idx on public.comments(status);
```

### `20260315000002_rls_policies.sql`

```sql
-- Enable RLS on all tables
alter table public.profiles   enable row level security;
alter table public.posts       enable row level security;
alter table public.tags        enable row level security;
alter table public.post_tags   enable row level security;
alter table public.comments    enable row level security;

-- ── profiles ──
create policy "users_read_own_profile" on public.profiles
  for select using (auth.uid() = id);

-- ── posts ──
create policy "public_read_posts" on public.posts
  for select using (status = 'published' and deleted_at is null);

create policy "author_manage_own_posts" on public.posts
  for all using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "admin_manage_all_posts" on public.posts
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── tags ──
create policy "public_read_tags" on public.tags
  for select using (true);

create policy "auth_insert_tags" on public.tags
  for insert with check (auth.uid() is not null);

create policy "auth_update_tags" on public.tags
  for update using (auth.uid() is not null);

create policy "auth_delete_tags" on public.tags
  for delete using (auth.uid() is not null);

-- ── post_tags ──
create policy "public_read_post_tags" on public.post_tags
  for select using (true);

create policy "auth_manage_post_tags" on public.post_tags
  for all using (auth.uid() is not null);

-- ── comments ──
create policy "public_read_approved_comments" on public.comments
  for select using (status = 'approved');

create policy "public_insert_comment" on public.comments
  for insert with check (status = 'pending');

create policy "auth_moderate_comments" on public.comments
  for update using (auth.uid() is not null)
  with check (status in ('approved', 'rejected'));

create policy "auth_read_all_comments" on public.comments
  for select using (auth.uid() is not null);
```

---

## Entity-Relationship Summary

```
profiles (1) ──────────────────── (N) posts
                                        │
                                        │ (N) post_tags (M)
                                        │
                                   tags (1) ──────────────── (N) post_tags
                                        │
                                   posts (1) ──────────────── (N) comments
```

**Cascade rules**:
- Delete `profiles` → RESTRICT (posts exist → cannot delete user)
- Delete `posts` → CASCADE to `post_tags`, `comments`
- Delete `tags` → RESTRICT (post_tags exist → cannot delete tag, enforces FR-012)
