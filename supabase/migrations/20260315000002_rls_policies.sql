-- Migration: rls_policies
-- Enables RLS and creates all policies for all 5 public tables

-- ──────────────────────────────────────────────────
-- Enable RLS on all tables
-- ──────────────────────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.posts       enable row level security;
alter table public.tags        enable row level security;
alter table public.post_tags   enable row level security;
alter table public.comments    enable row level security;

-- ──────────────────────────────────────────────────
-- profiles policies
-- ──────────────────────────────────────────────────
create policy "users_read_own_profile" on public.profiles
  for select using (auth.uid() = id);

-- Service role (server-only): reads all profiles for CMS author display
-- Handled by service_role key bypassing RLS

-- ──────────────────────────────────────────────────
-- posts policies
-- ──────────────────────────────────────────────────

-- Public: only published, non-deleted posts
create policy "public_read_posts" on public.posts
  for select using (status = 'published' and deleted_at is null);

-- Authors: full CRUD on own posts
create policy "author_manage_own_posts" on public.posts
  for all using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Admins: full CRUD on all posts
create policy "admin_manage_all_posts" on public.posts
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ──────────────────────────────────────────────────
-- tags policies
-- ──────────────────────────────────────────────────

-- Public: anyone can read tags
create policy "public_read_tags" on public.tags
  for select using (true);

-- Authenticated: create tags (auto-create on post tag input)
create policy "auth_insert_tags" on public.tags
  for insert with check (auth.uid() is not null);

-- Authenticated: update tags
create policy "auth_update_tags" on public.tags
  for update using (auth.uid() is not null);

-- Authenticated: delete tags (app layer also enforces post_count = 0)
create policy "auth_delete_tags" on public.tags
  for delete using (auth.uid() is not null);

-- ──────────────────────────────────────────────────
-- post_tags policies
-- ──────────────────────────────────────────────────

-- Public: anyone can read post-tag relationships
create policy "public_read_post_tags" on public.post_tags
  for select using (true);

-- Authenticated: manage post-tag relationships
create policy "auth_manage_post_tags" on public.post_tags
  for all using (auth.uid() is not null);

-- ──────────────────────────────────────────────────
-- comments policies
-- ──────────────────────────────────────────────────

-- Public: only approved comments visible
create policy "public_read_approved_comments" on public.comments
  for select using (status = 'approved');

-- Public: anyone can submit a pending comment
create policy "public_insert_comment" on public.comments
  for insert with check (status = 'pending');

-- Authenticated: moderate comments (approve or reject)
create policy "auth_moderate_comments" on public.comments
  for update using (auth.uid() is not null)
  with check (status in ('approved', 'rejected'));

-- Authenticated: read all comments (for CMS moderation queue)
create policy "auth_read_all_comments" on public.comments
  for select using (auth.uid() is not null);
