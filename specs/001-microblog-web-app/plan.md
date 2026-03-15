# Implementation Plan: Microblog Web App

**Branch**: `001-microblog-web-app` | **Date**: 2026-03-15 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-microblog-web-app/spec.md`

---

## Summary

Build a dynamic microblog web application where authenticated authors write short
Markdown posts (draft/publish lifecycle), attach Tags, and readers browse/comment
(with moderation). Public pages: home timeline, post detail, tag timelines.
CMS: post management, tag management, comment moderation.

**Technical approach**: Single Next.js 15 (App Router) monorepo handles both
frontend (React Server Components + Tailwind CSS) and backend (Route Handlers +
Server Actions). Supabase provides PostgreSQL, authentication (email/password),
and Row Level Security. Deployed to Vercel with Edge caching on public pages.

---

## Technical Context

**Language/Version**: TypeScript 5.x  
**Runtime**: Node.js 20 LTS (Vercel serverless + Edge runtime where applicable)  
**Framework**: Next.js 15.x — App Router, React Server Components, Server Actions,
Route Handlers  
**Styling**: Tailwind CSS 3.x  
**Storage**: Supabase (hosted PostgreSQL 15), `@supabase/ssr` for SSR-aware client  
**Auth**: Supabase Auth (email/password), session managed via cookies with
Next.js middleware guard for all `/admin/*` routes  
**Markdown**: `marked` + `DOMPurify` (sanitized HTML, no XSS)  
**Testing**: Vitest (unit), React Testing Library (component), Playwright (E2E)  
**Target Platform**: Vercel (serverless functions + Edge Network CDN)  
**Project Type**: Full-stack web application (monorepo, single Next.js project)  
**Performance Goals**: TTFB < 200 ms p95 on public pages (ISR/SSG + Vercel CDN);
CMS pages server-rendered on demand  
**Constraints**: Responsive at 320 px / 768 px / 1280 px; XSS-free Markdown
rendering; soft-delete only (no hard-deletes); all schema changes via migration
files  
**Scale/Scope**: Small-to-medium microblog (~10 k readers, ~5 authors, ~50 k
posts); 7 user stories, 26 FRs, 8 SCs

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Content-First | ✅ PASS | All routes serve the create→draft→publish→read→comment pipeline |
| II | Draft/Publish Lifecycle | ✅ PASS | `status` enum enforced in DB + RLS; soft-delete via `deleted_at` |
| III | Tag-Driven Navigation | ✅ PASS | `/tags/[slug]` page; auto-create on input; no category hierarchy |
| IV | Comment Moderation | ✅ PASS | All comments land in `pending`; approved-only shown publicly |
| V | Simplicity & YAGNI | ✅ PASS | Single Next.js project; no microservices; no real-time subs initially |
| — | Auth guard at middleware layer | ✅ PASS | `middleware.ts` matches `/admin/:path*` before any handler runs |
| — | Public queries filter deleted_at + status | ✅ PASS | Enforced in lib/queries and backed by RLS policies |
| — | Slug = pure unit-tested function | ✅ PASS | `lib/utils/slug.ts` — pure, no I/O, covered by Vitest |
| — | Server-side comment validation | ✅ PASS | Validated in Route Handler before any DB write |
| — | Schema changes via migrations | ✅ PASS | `supabase/migrations/` managed by Supabase CLI |

**Gate result: ALL PASS — proceed to Phase 0.**

---

## Project Structure

### Documentation (this feature)

```text
specs/001-microblog-web-app/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
│   ├── api-comments.md
│   ├── api-admin-posts.md
│   ├── api-admin-tags.md
│   └── api-admin-comments.md
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
microblog/                         ← repo root (Next.js monorepo)
├── src/
│   ├── app/
│   │   ├── layout.tsx             ← root layout, Tailwind globals
│   │   ├── globals.css
│   │   ├── page.tsx               ← / — home timeline (RSC)
│   │   ├── posts/
│   │   │   └── [slug]/
│   │   │       └── page.tsx       ← /posts/[slug] (RSC + comment form)
│   │   ├── tags/
│   │   │   └── [slug]/
│   │   │       └── page.tsx       ← /tags/[slug] (RSC)
│   │   ├── admin/
│   │   │   ├── layout.tsx         ← shared admin shell (auth-checked by middleware)
│   │   │   ├── login/
│   │   │   │   └── page.tsx       ← /admin/login
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx       ← post list
│   │   │   │   ├── new/page.tsx   ← create post
│   │   │   │   └── [id]/edit/page.tsx ← edit post
│   │   │   ├── tags/
│   │   │   │   └── page.tsx       ← tag management
│   │   │   └── comments/
│   │   │       └── page.tsx       ← comment moderation queue
│   │   └── api/
│   │       ├── comments/
│   │       │   └── route.ts       ← POST /api/comments (public)
│   │       └── admin/
│   │           ├── posts/
│   │           │   ├── route.ts           ← GET, POST
│   │           │   └── [id]/route.ts      ← PATCH, DELETE
│   │           ├── tags/
│   │           │   ├── route.ts           ← GET, POST
│   │           │   └── [id]/route.ts      ← PATCH, DELETE
│   │           └── comments/
│   │               └── [id]/route.ts      ← PATCH (approve/reject)
│   ├── components/
│   │   ├── ui/                    ← generic primitives (Button, Input, Badge…)
│   │   ├── post/
│   │   │   ├── PostCard.tsx       ← card on home/tag timeline
│   │   │   └── PostBody.tsx       ← rendered Markdown HTML
│   │   ├── comment/
│   │   │   ├── CommentList.tsx
│   │   │   └── CommentForm.tsx    ← public submit form
│   │   ├── tag/
│   │   │   └── TagBadge.tsx
│   │   └── admin/
│   │       ├── PostEditor.tsx     ← title + Markdown textarea + tag input
│   │       └── CommentModerationRow.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          ← browser Supabase client
│   │   │   └── server.ts          ← SSR Supabase client (@supabase/ssr)
│   │   ├── queries/
│   │   │   ├── posts.ts           ← typed DB queries (public + admin)
│   │   │   ├── tags.ts
│   │   │   └── comments.ts
│   │   ├── utils/
│   │   │   ├── slug.ts            ← pure slug generator (unit-tested)
│   │   │   └── markdown.ts        ← marked + DOMPurify pipeline
│   │   └── validations/
│   │       ├── post.ts            ← Zod schemas
│   │       ├── tag.ts
│   │       └── comment.ts
│   ├── middleware.ts               ← auth guard: matches /admin/:path*
│   └── types/
│       ├── database.types.ts      ← generated: `supabase gen types typescript`
│       └── index.ts               ← re-exports + domain types
├── supabase/
│   ├── migrations/
│   │   ├── 20260315000001_initial_schema.sql
│   │   └── 20260315000002_rls_policies.sql
│   └── seed.sql
├── tests/
│   ├── unit/
│   │   ├── slug.test.ts
│   │   ├── markdown.test.ts
│   │   └── comment-validation.test.ts
│   ├── integration/
│   │   └── api-comments.test.ts
│   └── e2e/
│       ├── home-timeline.spec.ts
│       ├── post-publish.spec.ts
│       └── comment-moderation.spec.ts
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

**Structure Decision**: Single Next.js App Router monorepo. Next.js unifies FE
(RSC + Client Components) and BE (Route Handlers + Server Actions) in one
deployable unit — no separate backend service needed. Supabase is accessed
exclusively via the `@supabase/ssr` server client from Route Handlers and Server
Components; the browser client is used only for auth-related cookie refresh in
the middleware. This satisfies the Simplicity & YAGNI principle.

---

## Complexity Tracking

> No constitutional violations found — table omitted per instruction.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
