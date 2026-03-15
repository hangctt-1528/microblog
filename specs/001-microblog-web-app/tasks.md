# Tasks: Microblog Web App

**Input**: Design documents from `/specs/001-microblog-web-app/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅  
**Generated**: 2026-03-15  
**Stack**: Next.js 15 · TypeScript 5 · Tailwind CSS 3 · Supabase · Vercel  
**Total tasks**: 74 across 10 phases

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependencies)
- **[US#]**: Maps to user story from spec.md
- Exact file paths are included in every task description

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Bootstrap the Next.js project and install all tooling. No app code yet.

- [ ] T001 Initialize Next.js 15 App Router project with TypeScript, Tailwind CSS, ESLint, `src/` directory, and `@/*` import alias via `pnpm create next-app@latest`; verify `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts` are generated
- [ ] T002 Install production dependencies: `@supabase/supabase-js @supabase/ssr marked isomorphic-dompurify zod`
- [ ] T003 [P] Install dev dependencies: `vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @playwright/test`
- [ ] T004 [P] Configure Vitest in `vitest.config.ts` (plugin-react, jsdom environment, path alias `@/*` matching tsconfig)
- [ ] T005 [P] Configure Playwright in `playwright.config.ts` (baseURL `http://localhost:3000`, webServer pointing to `pnpm dev`, trace on first-retry)
- [ ] T006 [P] Initialise Supabase CLI: run `supabase init` from repo root; creates `supabase/` directory with `config.toml`
- [ ] T007 [P] Create `.env.local.example` with all required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] T008 Bootstrap shadcn/ui: run `pnpm dlx shadcn@latest init` (TypeScript, default style, `src/components/ui/` output); then add primitives: `button input badge textarea label`

**Checkpoint**: `pnpm dev` runs without errors. `pnpm vitest run` exits 0 (no tests yet). Shadcn components exist under `src/components/ui/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth middleware, core utilities, and typed query layer.
**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T009 Create database migration `supabase/migrations/20260315000001_initial_schema.sql` — defines tables `profiles`, `posts`, `tags`, `post_tags`, `comments` with all columns, CHECK constraints, FK constraints, and indexes as specified in `data-model.md`
- [ ] T010 Create RLS policies migration `supabase/migrations/20260315000002_rls_policies.sql` — enables RLS on all 5 tables and creates all policies from `data-model.md` (public_read_posts, author_manage_own_posts, public_insert_comment, auth_moderate_comments, etc.)
- [ ] T011 Create seed data `supabase/seed.sql` — inserts ≥2 published posts with different tags, ≥1 draft post, and ≥1 approved comment to support local development and independent test criteria
- [ ] T012 Apply migrations locally (`supabase db push`) and regenerate TypeScript types (`supabase gen types typescript --local > src/types/database.types.ts`)
- [ ] T013 Implement `src/lib/supabase/server.ts` — SSR-aware Supabase client using `createServerClient` from `@supabase/ssr` with `cookies()` from `next/headers`; typed with `Database` from `database.types.ts`
- [ ] T014 [P] Implement `src/lib/supabase/client.ts` — browser Supabase client using `createBrowserClient` from `@supabase/ssr`; typed with `Database`
- [ ] T015 Implement `src/middleware.ts` — auth guard using `createServerClient` from `@supabase/ssr`; calls `supabase.auth.getUser()`; redirects unauthenticated requests on `/admin/:path*` (excluding `/admin/login`) to `/admin/login`; set `config.matcher = ['/admin/:path*']`
- [ ] T016 [P] Implement `src/lib/utils/slug.ts` — export pure function `generateSlug(title: string): string` (NFD normalize → strip diacritics → lowercase → replace non-alphanumeric with `-` → trim hyphens → truncate to 80 chars)
- [ ] T017 [P] Implement `src/lib/utils/markdown.ts` — export `renderMarkdown(raw: string): string` using `marked.parse()` + `DOMPurify.sanitize()` with `FORBID_TAGS: ['script','iframe','object','embed']` and `FORBID_ATTR: ['onerror','onclick','onload']`
- [ ] T018 [P] Implement `src/lib/validations/comment.ts` — Zod schema `commentSchema` with fields: `post_id` (uuid), `author_name` (non-empty string max 200), `author_email` (z.string().email()), `body` (non-empty string max 5000); export inferred TypeScript type
- [ ] T019 [P] Implement `src/lib/validations/post.ts` — Zod schema `postSchema` with fields: `title` (non-empty string max 500), `body_markdown` (string default `''`), `slug` (optional, regex `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`), `tag_ids` (optional uuid array); export inferred type
- [ ] T020 [P] Implement `src/lib/validations/tag.ts` — Zod schema `tagSchema` with fields: `name` (non-empty string max 100, trimmed), `slug` (optional, same regex as post slug); export inferred type
- [ ] T021 [P] Write unit tests for `slug.ts` in `tests/unit/slug.test.ts` covering: basic ASCII conversion, Unicode/diacritic stripping, truncation at 80 chars without mid-word break, consecutive special characters collapse to single hyphen, leading/trailing hyphen trimming, empty string input
- [ ] T022 [P] Write unit tests for `markdown.ts` in `tests/unit/markdown.test.ts` covering: Markdown headings/bold/links render to HTML, `<script>` tag stripped, `<iframe>` stripped, `onclick` attribute stripped, empty string renders to empty string
- [ ] T023 [P] Write unit tests for `comment.ts` validation in `tests/unit/comment-validation.test.ts` covering: valid payload passes, empty `author_name` fails, invalid email fails, empty `body` fails, missing `post_id` fails
- [ ] T024 Implement `src/lib/queries/posts.ts` — typed query functions: `getPublishedPosts()` (filter `status='published' AND deleted_at IS NULL`, order `published_at DESC`, join `post_tags→tags`), `getPostBySlug(slug)` (same filters + slug match), `getAdminPosts(statusFilter?)` (no public filters, include deleted flag, join author + tags)
- [ ] T025 [P] Implement `src/lib/queries/tags.ts` — `getTagBySlug(slug)`, `getPostsByTag(tagId)` (published+non-deleted, order published_at DESC), `getAllTagsWithCount()` (join post_tags for count), `getOrCreateTag(name)` (upsert by name, auto-generate slug)
- [ ] T026 [P] Implement `src/lib/queries/comments.ts` — `getApprovedComments(postId)` (filter `status='approved'`, order `created_at ASC`), `getPendingComments()` (filter `status='pending'`, join post title+slug, paginate)
- [ ] T027 Configure root layout `src/app/layout.tsx` — import `./globals.css`, set HTML `lang="en"`, add `<body>` with Inter font via `next/font`; update `globals.css` to include Tailwind base/components/utilities directives; create `src/types/index.ts` re-exporting domain types

**Checkpoint**: `pnpm vitest run` passes all slug + markdown + validation unit tests. `supabase db push` applies cleanly. TypeScript `pnpm tsc --noEmit` reports zero errors.

---

## Phase 3: User Story 1 — Reader Browses the Home Timeline (P1) 🎯 MVP

**Goal**: Public home page lists all published posts newest-first; clicking a post loads the full post page with rendered Markdown.

**Independent Test**: Seed DB has ≥2 published posts + ≥1 draft. Navigate to `/` — published posts appear newest-first, draft is absent. Click one post — full content renders at `/posts/[slug]`. Soft-deleted post never appears.

- [ ] T028 [P] [US1] Implement `src/components/tag/TagBadge.tsx` — styled badge rendering `tag.name`; wraps in `<Link href="/tags/[slug]">` using Tailwind `bg-slate-100 rounded-full px-2 py-0.5 text-sm`
- [ ] T029 [P] [US1] Implement `src/components/ui/EmptyState.tsx` — reusable component accepting `message: string` prop; renders centred paragraph with muted text
- [ ] T030 [P] [US1] Implement `src/components/post/PostCard.tsx` — displays `title` (as `<Link href="/posts/[slug]">`), `published_at` formatted date, excerpt (first 160 chars of `body_markdown` stripped of Markdown syntax), and tag badges via `TagBadge`
- [ ] T031 [P] [US1] Implement `src/components/ui/Nav.tsx` — site header with microblog name linking to `/`; sticky top bar using Tailwind; responsive at all breakpoints
- [ ] T032 [US1] Implement home page `src/app/page.tsx` — RSC: call `getPublishedPosts()` from `lib/queries/posts.ts`; render list of `PostCard` components; show `EmptyState` if no posts; no client JS required
- [ ] T033 [P] [US1] Implement `src/components/post/PostBody.tsx` — client-safe component rendering pre-sanitized HTML via `dangerouslySetInnerHTML={{ __html: html }}`; add `prose` typography styles via Tailwind
- [ ] T034 [US1] Implement post detail page `src/app/posts/[slug]/page.tsx` — RSC: call `getPostBySlug(slug)`, call `notFound()` if not found or `deleted_at IS NOT NULL`; render `PostBody` with `renderMarkdown(post.body_markdown)`; add `generateMetadata` returning post title + description
- [ ] T035 [US1] Wire `Nav` into root layout `src/app/layout.tsx` — add `<Nav />` above `{children}`; verify responsive layout at 320px, 768px, 1280px

**Checkpoint**: `pnpm dev` → navigate to `/` — seed posts visible, newest first, each showing excerpt + tags. Click post → `/posts/[slug]` renders HTML. Draft post absent from home. `pnpm tsc --noEmit` clean.

---

## Phase 4: User Story 2 — Author Creates and Publishes a Post (P2)

**Goal**: Authenticated author can log in to CMS, create a Markdown post as draft, preview it, then publish — post immediately appears on `/`.

**Independent Test**: Log in at `/admin/login`. Create post with Markdown body → verify absent from `/`. Click Publish → verify post appears on `/` and at `/posts/[slug]` with rendered HTML. Unauthenticated GET `/admin/posts` → 302 redirect to `/admin/login`.

- [ ] T036 [US2] Implement admin login page `src/app/admin/login/page.tsx` — client component with email + password form; calls `supabase.auth.signInWithPassword()`; on success redirects to `/admin/posts`; show error message on failure
- [ ] T037 [US2] Implement admin layout `src/app/admin/layout.tsx` — shared shell with sidebar nav (links: Posts `/admin/posts`, Tags `/admin/tags`, Comments `/admin/comments`); logout button calling `supabase.auth.signOut()` + redirect to `/admin/login`; confirms middleware guard is in place
- [ ] T038 [P] [US2] Implement `src/components/admin/PostEditor.tsx` — controlled client component with: `title` input (auto-triggers `generateSlug` preview), `slug` input (editable override), `body_markdown` textarea, live Markdown preview panel (calls `renderMarkdown`), submit + cancel buttons; accepts `initialData?` for edit mode
- [ ] T039 [US2] Implement `POST /api/admin/posts` route handler in `src/app/api/admin/posts/route.ts` — validate body with `postSchema`; call `generateSlug(title)` if no slug override; check slug uniqueness (append `-2`, `-3` on collision); insert post with `author_id = session.user.id`, `status = 'draft'`; return 201 with created post
- [ ] T040 [US2] Implement new post page `src/app/admin/posts/new/page.tsx` — renders `PostEditor`; on submit calls Server Action → `POST /api/admin/posts` → redirects to `/admin/posts` on success
- [ ] T041 [US2] Implement admin posts list page `src/app/admin/posts/page.tsx` — RSC: call `getAdminPosts()` (all non-deleted); table rows showing title, status badge, published_at, author; "New Post" button linking to `/admin/posts/new`; Publish button per draft row
- [ ] T042 [US2] Extend `PATCH /api/admin/posts/[id]` route handler in `src/app/api/admin/posts/[id]/route.ts` — support `action: 'publish'` (set `status='published'`, `published_at=now()`); call `revalidatePath('/')` and `revalidatePath('/posts/[slug]')`; return 200 with updated post
- [ ] T043 [US2] Wire Publish button in `src/app/admin/posts/page.tsx` — Server Action calling `PATCH /api/admin/posts/[id]` with `{ action: 'publish' }`; revalidate admin list after success

**Checkpoint**: Full auth + create + publish flow works. Draft absent from `/`. Published post visible on `/` immediately. Unauthenticated `/admin/*` → redirect. `pnpm tsc --noEmit` clean.

---

## Phase 5: User Story 3 — Author Attaches Tags & Reader Browses Tag Page (P3)

**Goal**: Author can add tags to a post (auto-created if new); readers browse `/tags/[slug]` to see all published posts for that tag.

**Independent Test**: Create two published posts — one tagged "tech", one tagged "life". Visit `/tags/tech` → only first post. Visit `/tags/life` → only second. Visit `/tags/nonexistent` → empty state, no crash.

- [ ] T044 [US3] Extend `src/lib/queries/tags.ts` — implement `upsertTagsByNames(names: string[]): Promise<Tag[]>` that calls `getOrCreateTag` for each name, auto-generating slug via `generateSlug`; used by post create/update flow
- [ ] T045 [US3] Extend `src/components/admin/PostEditor.tsx` — add tag input with comma-separated entry; display existing tags as removable badges; accept `availableTags` prop for autocomplete suggestions; include `tag_ids` in form submission payload
- [ ] T046 [US3] Extend `POST /api/admin/posts` and `PATCH /api/admin/posts/[id]` in `src/app/api/admin/posts/route.ts` and `src/app/api/admin/posts/[id]/route.ts` — after post upsert, call `upsertTagsByNames(tagNames)` then delete+reinsert all `post_tags` rows for the post (replace strategy)
- [ ] T047 [US3] Implement `POST /api/admin/tags` route handler in `src/app/api/admin/tags/route.ts` — validate with `tagSchema`; auto-generate slug if not provided; insert tag; return 201; return 409 if name or slug already exists
- [ ] T048 [US3] Implement tag page `src/app/tags/[slug]/page.tsx` — RSC: call `getTagBySlug(slug)` → `notFound()` if not found; call `getPostsByTag(tag.id)` (published + non-deleted, order `published_at DESC`); render list of `PostCard`; show `EmptyState` if no posts; add `generateMetadata` with tag name
- [ ] T049 [P] [US3] Update `src/app/admin/posts/page.tsx` — pass `availableTags` (from `getAllTagsWithCount()`) to `PostEditor` for autocomplete; and pass `availableTags` to `new/page.tsx` and `[id]/edit/page.tsx`

**Checkpoint**: Create post with tags in CMS → tags appear on PostCard on `/`. Tag page shows correct published posts only. Drafts absent from tag page. Auto-created tag persists in DB.

---

## Phase 6: User Story 4 — Reader Submits a Comment (P4)

**Goal**: Any reader can submit a comment on a published post without logging in; comment lands in `pending` queue and is NOT visible publicly yet.

**Independent Test**: Visit `/posts/[slug]`. Submit comment form with valid name, email, body → confirmation message shown, comment NOT visible on page. Open CMS comments → comment appears as `pending`.

- [ ] T050 [P] [US4] Implement `src/components/comment/CommentForm.tsx` — client component with `author_name`, `author_email`, `body` fields; on submit calls `POST /api/comments`; displays field-level validation errors from response; shows success message "Your comment is awaiting moderation." on 201; disables form while submitting
- [ ] T051 [P] [US4] Implement `src/components/comment/CommentList.tsx` — RSC-compatible component accepting `comments: Comment[]`; renders each comment with author name, date, body; shows `EmptyState` if empty; never shows `pending` or `rejected` comments
- [ ] T052 [US4] Implement `POST /api/comments` route handler in `src/app/api/comments/route.ts` — validate body with `commentSchema`; verify post exists with `status='published'` and `deleted_at IS NULL` (return 404 if not); insert comment with `status='pending'` (never from client input); return 201 with confirmation message
- [ ] T053 [US4] Extend post detail page `src/app/posts/[slug]/page.tsx` — add `CommentList` (RSC: call `getApprovedComments(post.id)`) + `CommentForm` below `PostBody`; ensure comments section has clear visual separation

**Checkpoint**: Submit valid comment → 201, "awaiting moderation" message, not visible. Submit with empty email → 422 + field error shown. Comment on soft-deleted post URL → 404.

---

## Phase 7: User Story 5 — Author/Admin Moderates Comments (P5)

**Goal**: Authenticated moderator views pending comments in CMS and approves or rejects each one; approved comments immediately appear on the post page.

**Independent Test**: Submit two pending comments (P4 done). In `/admin/comments`, approve first → rejects second. Visit `/posts/[slug]` → only approved comment visible.

- [ ] T054 [P] [US5] Implement `GET /api/admin/comments` route handler in `src/app/api/admin/comments/route.ts` — supports `status` query param (default `pending`), pagination `page`/`per_page`; joins `posts` table to include `post_title` and `post_slug`; return paginated list
- [ ] T055 [P] [US5] Implement `PATCH /api/admin/comments/[id]` route handler in `src/app/api/admin/comments/[id]/route.ts` — validate `action ∈ {approve, reject}`; return 409 if comment already moderated; update `status`; call `revalidatePath('/posts/[slug]')` after approve; return 200 with updated comment
- [ ] T056 [P] [US5] Implement `src/components/admin/CommentModerationRow.tsx` — displays `author_name`, `author_email`, `body`, `post_title` (linked to `/posts/[slug]`), `created_at`; Approve and Reject buttons; buttons disabled after action taken
- [ ] T057 [US5] Implement admin comments page `src/app/admin/comments/page.tsx` — RSC: call `getPendingComments()`; render list of `CommentModerationRow`; Server Actions for approve/reject that call `PATCH /api/admin/comments/[id]`; show count of pending; show empty state when queue is clear

**Checkpoint**: Two pending comments → approve first, reject second → visit `/posts/[slug]` → only approved comment visible. CMS queue no longer shows moderated comments.

---

## Phase 8: User Story 6 — Author Manages Existing Posts in CMS (P6)

**Goal**: Author can edit, unpublish, or soft-delete any of their posts. Soft-deleted posts disappear from all public pages immediately but remain in the DB.

**Independent Test**: Publish a post → appears on `/`. Soft-delete → gone from `/` and `/posts/[slug]` (returns 404); DB row still exists with `deleted_at` set. Unpublish a different post → disappears from public pages, shows as draft in CMS.

- [ ] T058 [US6] Extend `PATCH /api/admin/posts/[id]` route handler in `src/app/api/admin/posts/[id]/route.ts` — add support for: content edit (title, body_markdown, slug, tag_ids), `action:'unpublish'` (status=draft, published_at=null), `action:'delete'` (soft-delete: deleted_at=now()); call appropriate `revalidatePath` after each action
- [ ] T059 [US6] Implement edit post page `src/app/admin/posts/[id]/edit/page.tsx` — RSC: fetch post by ID via `getAdminPosts()`; render `PostEditor` pre-filled with existing data (title, slug, body_markdown, tag_ids); Server Action on submit calls `PATCH /api/admin/posts/[id]` with updated fields
- [ ] T060 [P] [US6] Extend admin posts list `src/app/admin/posts/page.tsx` — add per-row action buttons: "Edit" (links to `/admin/posts/[id]/edit`), "Unpublish" (Server Action for `action:'unpublish'`), "Delete" (Server Action for `action:'delete'` with confirmation); visually indicate deleted rows differently
- [ ] T061 [US6] Harden public query guards in `src/lib/queries/posts.ts` — verify `getPublishedPosts()`, `getPostBySlug()`, and `getPostsByTag()` ALL filter `deleted_at IS NULL AND status='published'`; add regression unit test in `tests/unit/post-queries.test.ts` asserting soft-deleted and draft posts are excluded

**Checkpoint**: Publish → on `/`. Soft-delete → 404 at `/posts/[slug]`, absent from `/`. DB row intact. Unpublish → draft in CMS, absent from public.

---

## Phase 9: User Story 7 — Author/Admin Manages Tags in CMS (P7)

**Goal**: CMS user can list all tags, manually create new ones, rename existing ones, and delete tags only when no posts reference them.

**Independent Test**: In CMS tags list, create new tag "design". Rename "design" → "ux-design" → slug updates to "ux-design". Try deleting tag still used by a post → system refuses with error message. Delete unused tag → removed successfully.

- [ ] T062 [US7] Extend `GET /api/admin/tags` route handler in `src/app/api/admin/tags/route.ts` — query all tags with `post_count` via `count(post_tags.tag_id)` join; return sorted by name
- [ ] T063 [P] [US7] Implement `PATCH /api/admin/tags/[id]` route handler in `src/app/api/admin/tags/[id]/route.ts` — validate with `tagSchema`; auto-generate new slug from new name if not provided; check new slug not already taken by another tag (409 if collision); update `name` and `slug`; call `revalidatePath('/tags/[old-slug]')` and `revalidatePath('/tags/[new-slug]')`
- [ ] T064 [P] [US7] Implement `DELETE /api/admin/tags/[id]` route handler in `src/app/api/admin/tags/[id]/route.ts` — check `post_tags` count for this tag; return 409 with explanatory message if count > 0 (FR-012); permanently remove tag if count = 0; return 204
- [ ] T065 [US7] Implement admin tags page `src/app/admin/tags/page.tsx` — RSC: fetch all tags with counts via `getAllTagsWithCount()`; render table with name, slug, post_count; inline "Create Tag" form (Server Action → `POST /api/admin/tags`); "Rename" button per row (inline edit); "Delete" button per row disabled with tooltip if post_count > 0

**Checkpoint**: Create tag → appears in list. Rename → name + slug update, `/tags/[new-slug]` works. Delete in-use tag → inline error. Delete unused tag → removed from list.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Responsive layout, error boundaries, ISR cache wiring, and E2E tests.

- [ ] T066 [P] Implement `src/app/not-found.tsx` (global 404 page), `src/app/posts/[slug]/not-found.tsx`, and `src/app/tags/[slug]/not-found.tsx` — each shows a clear human-readable not-found message with a link back to `/`
- [ ] T067 [P] Implement slug collision handling in `src/lib/queries/posts.ts` — `ensureUniqueSlug(baseSlug, excludeId?)` function: queries DB for existing slugs matching `baseSlug`, `baseSlug-2`, … and returns first available; used in `POST /api/admin/posts` and `PATCH /api/admin/posts/[id]`
- [ ] T068 [P] Audit and complete `revalidatePath` calls across all admin mutations — verify publish, unpublish, soft-delete, edit, tag rename, comment approve all call `revalidatePath` for affected public routes (`/`, `/posts/[slug]`, `/tags/[slug]`)
- [ ] T069 [P] Responsive layout audit — verify `PostCard`, home page, post detail, tag page, and admin pages render correctly at 320px (mobile), 768px (tablet), 1280px (desktop) using Tailwind `sm:` / `md:` / `lg:` breakpoints; fix any overflow or font-size issues
- [ ] T070 [P] Write E2E test `tests/e2e/home-timeline.spec.ts` — scenario: seed posts exist → load `/` → both published posts appear newest-first → draft absent → click post → full content renders → back to home within 3 clicks
- [ ] T071 [P] Write E2E test `tests/e2e/post-publish.spec.ts` — scenario: log in → create post as draft → verify absent from `/` → publish → verify appears on `/` and at `/posts/[slug]` with rendered Markdown → unauthenticated access to `/admin/posts` → redirect to login
- [ ] T072 [P] Write E2E test `tests/e2e/comment-moderation.spec.ts` — scenario: submit 2 comments on a post → CMS approve first, reject second → visit `/posts/[slug]` → only approved comment visible
- [ ] T073 Run quickstart.md validation — follow steps exactly from `specs/001-microblog-web-app/quickstart.md` in a clean environment; confirm `pnpm dev`, migrations, type generation, and `vercel deploy --prod` all succeed; update quickstart if any step is inaccurate
- [ ] T074 [P] Update `.github/agents/copilot-instructions.md` via `SPECIFY_FEATURE=001-microblog-web-app bash .specify/scripts/bash/update-agent-context.sh copilot` after all source code is in place

**Final Checkpoint**: `pnpm vitest run` all tests pass. `pnpm exec playwright test` all E2E pass. `pnpm tsc --noEmit` clean. `vercel deploy --prod` succeeds. All 8 success criteria from spec.md verified.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1  (Setup)         ──────────────────────────► no deps, start immediately
Phase 2  (Foundational)  ── needs Phase 1 ──────────► BLOCKS all user stories
Phase 3  (US1 P1)        ── needs Phase 2 ──────────► MVP entry point
Phase 4  (US2 P2)        ── needs Phase 2 ──────────► can parallel with US1
Phase 5  (US3 P3)        ── needs Phase 4 ──────────► tags wired via PostEditor
Phase 6  (US4 P4)        ── needs Phase 3 ──────────► post detail page must exist
Phase 7  (US5 P5)        ── needs Phase 6 ──────────► moderation needs comments
Phase 8  (US6 P6)        ── needs Phase 4 ──────────► extends post admin from US2
Phase 9  (US7 P7)        ── needs Phase 5 ──────────► extends tag admin from US3
Phase 10 (Polish)        ── needs all above ─────────► cross-cutting
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|-----------|----------------|
| US1 (P1) | Phase 2 done | Foundational complete |
| US2 (P2) | Phase 2 done | Foundational complete (parallel with US1) |
| US3 (P3) | US2 done | Author can create posts first |
| US4 (P4) | US1 done | Post detail page must exist |
| US5 (P5) | US4 done | Comments must exist to moderate |
| US6 (P6) | US2 done | Admin posts CRUD must exist |
| US7 (P7) | US3 done | Tag admin builds on US3 tag system |

### Parallel Opportunities Per Phase

**Phase 2**: T013→T015 sequential (middleware needs client). T016–T026 fully parallel (all different files).

**Phase 3 (US1)**: T028, T029, T030, T031, T033 all parallel (different components/pages).

**Phase 4 (US2)**: T038 (PostEditor) parallel with T039 (API route). T040 needs both.

**Phase 5 (US3)**: T047 (POST tags API) parallel with T048 (tag page).

**Phase 6 (US4)**: T050 (CommentForm) and T051 (CommentList) fully parallel.

**Phase 7 (US5)**: T054, T055, T056 all parallel.

**Phase 8 (US6)**: T058 (API extend) and T059 (edit page) partially parallel.

**Phase 9 (US7)**: T063 and T064 fully parallel.

**Phase 10**: T066–T072 all parallel (different files/test files).

---

## Parallel Execution Examples

### MVP Sprint (US1 only — 2 developers after Phase 2)

```
Dev A: T028, T030, T032 (PostCard, EmptyState, home page)
Dev B: T029, T033, T034 (TagBadge, PostBody, post detail)
→ Merge → T031, T035 (wire layout)
→ Checkpoint: MVP live
```

### Post-MVP Sprint (US2 + US6 parallel — 2 developers)

```
Dev A: T036, T037, T039, T040, T041 (login, layout, create post flow)
Dev B: T038 (PostEditor component — shared by both stories)
→ Dev A continues: T042, T043 (publish)
→ Dev B: T058, T059, T060 (edit, unpublish, delete)
→ Checkpoint: full post lifecycle
```

---

## Implementation Strategy

### MVP Scope (User Story 1 only)

1. ✅ Complete Phase 1 (Setup)
2. ✅ Complete Phase 2 (Foundational) — critical blocker
3. ✅ Complete Phase 3 (US1) — home timeline + post detail
4. **STOP & VALIDATE**: seed data → verify `/` and `/posts/[slug]` work
5. **Deploy to Vercel** — first public URL

### Incremental Delivery

| Sprint | Delivers | Stories Done |
|--------|----------|-------------|
| Sprint 1 | Setup + Foundational | — |
| Sprint 2 | Home timeline, Post detail | US1 ✅ |
| Sprint 3 | CMS login, Create + Publish post | US1+US2 ✅ |
| Sprint 4 | Tags on posts + Tag pages | US1+US2+US3 ✅ |
| Sprint 5 | Comment submission | US1–US4 ✅ |
| Sprint 6 | Comment moderation | US1–US5 ✅ |
| Sprint 7 | Edit/unpublish/delete posts | US1–US6 ✅ |
| Sprint 8 | Tag management in CMS | US1–US7 ✅ |
| Sprint 9 | Polish, responsive, E2E | Full ✅ |

### Parallel Team Strategy (3 developers post-Phase 2)

```
Dev A: US1 (Phase 3) → US4 (Phase 6)
Dev B: US2 (Phase 4) → US6 (Phase 8)
Dev C: US3 (Phase 5) → US7 (Phase 9)
All:   US5 (Phase 7) → Phase 10 Polish
```

---

## Task Summary

| Phase | Tasks | Story | Parallel Tasks |
|-------|-------|-------|---------------|
| Phase 1 — Setup | T001–T008 (8) | — | T003, T004, T005, T006, T007 |
| Phase 2 — Foundational | T009–T027 (19) | — | T014, T016–T026 |
| Phase 3 — US1 Home Timeline | T028–T035 (8) | US1 | T028–T031, T033 |
| Phase 4 — US2 Create & Publish | T036–T043 (8) | US2 | T038 |
| Phase 5 — US3 Tags | T044–T049 (6) | US3 | T047, T049 |
| Phase 6 — US4 Comment Submit | T050–T053 (4) | US4 | T050, T051 |
| Phase 7 — US5 Moderation | T054–T057 (4) | US5 | T054, T055, T056 |
| Phase 8 — US6 Manage Posts | T058–T061 (4) | US6 | T060 |
| Phase 9 — US7 Manage Tags | T062–T065 (4) | US7 | T063, T064 |
| Phase 10 — Polish | T066–T074 (9) | — | T066–T072, T074 |
| **Total** | **74 tasks** | | |
