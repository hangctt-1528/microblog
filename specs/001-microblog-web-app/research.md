# Research: Microblog Web App — Phase 0

**Feature**: `001-microblog-web-app`  
**Date**: 2026-03-15  
**Sources**: Context7 (Next.js docs, Supabase docs), official Vercel/Tailwind docs

---

## 1. Next.js 15 — App Router

### Decision
Use **Next.js 15 App Router** with React Server Components (RSC) as the
primary rendering model. Route Handlers handle JSON API endpoints (comments
submit, admin CRUD). Server Actions are used for simple form mutations in the
CMS (create/edit post, tag CRUD, comment approve/reject).

### Rationale
- RSC eliminates client-side data fetching waterfalls on public pages (home,
  post detail, tag page) → better Core Web Vitals.
- `middleware.ts` runs at the Edge before any route handler — ideal for the
  auth guard on `/admin/:path*`.
- A single Next.js project satisfies **Simplicity & YAGNI**: no separate
  Express/Fastify backend is needed.
- Vercel is the canonical deployment target for Next.js — zero-config deploy,
  automatic ISR invalidation, Edge Network caching.

### Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| Pages Router | Legacy model; lacks native RSC; more boilerplate for layouts |
| Separate Next.js FE + Express BE | Two deployments, two codebases — violates YAGNI for this scale |
| Remix | Strong candidate; rejected because Vercel has tighter Next.js integration |
| Astro + API server | Overkill for a content site with a CMS; no mature auth story |

### Key Patterns (from Context7)
```typescript
// middleware.ts — auth guard (runs at Edge)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Refresh session cookie + redirect unauthenticated /admin requests
}
export const config = { matcher: ['/admin/:path*'] }
```

```typescript
// Server Component page — zero client JS
export default async function HomePage() {
  const posts = await getPublishedPosts() // direct DB query
  return <PostList posts={posts} />
}
```

```typescript
// Server Action — CMS form mutation
'use server'
export async function publishPost(id: string) {
  const supabase = await createServerClient()
  await supabase.from('posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/')
}
```

---

## 2. TypeScript 5.x

### Decision
TypeScript throughout — all source files `.ts` / `.tsx`. Strict mode enabled.
Supabase-generated types (`database.types.ts`) used for all DB operations.

### Rationale
- Type-safe DB access eliminates a class of runtime bugs (wrong column names,
  nullable mismatches).
- `supabase gen types typescript` produces `Database` interface used with
  `createClient<Database>()`.
- Zod for runtime validation (comment form, post form) — provides both
  TypeScript types and runtime schema enforcement.

### Key Config
```json
// tsconfig.json (relevant flags)
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

---

## 3. Tailwind CSS 3.x

### Decision
Tailwind CSS v3 via PostCSS. Utility-first; no CSS-in-JS, no CSS Modules for
core layout. Component library: **shadcn/ui** (Radix UI primitives + Tailwind
variants) for form inputs, buttons, badges — avoids writing accessible
components from scratch.

### Rationale
- Tailwind produces minimal CSS bundle (PurgeCSS built-in).
- shadcn/ui components are copy-pasted into `src/components/ui/` — no runtime
  dependency, easy to customise, WCAG-accessible out of the box.
- Satisfies responsive requirement (320 / 768 / 1280 px) via `sm:` / `md:`
  / `lg:` breakpoints.

### Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| CSS Modules | More boilerplate; less utility-composability |
| MUI / Chakra | Heavy runtime dependency; opinionated theming conflicts with Tailwind |
| Styled Components | CSS-in-JS increases bundle; poor RSC compatibility |

### Config (from Context7)
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx,mdx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
export default config
```

---

## 4. Supabase

### Decision
Use **Supabase** for:
1. **PostgreSQL 15** — primary data store with strict RLS policies
2. **Supabase Auth** — email/password sign-in for CMS authors/admins
3. **`@supabase/ssr`** — SSR-aware client for Next.js (handles cookie-based
   session refresh in middleware + Server Components)

### Rationale
- Supabase Auth natively integrates with RLS via `auth.uid()` — no custom JWT
  parsing needed.
- `@supabase/ssr` replaces the deprecated `@supabase/auth-helpers-nextjs` and
  is the recommended package for Next.js App Router.
- Migration files managed by Supabase CLI (`supabase db push`) ensure all
  schema changes are version-controlled.
- Hosted PostgreSQL removes infrastructure overhead.

### Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| PlanetScale (MySQL) | No RLS; different SQL dialect |
| Neon Postgres | No built-in auth; requires separate auth provider |
| Firebase Firestore | NoSQL; harder to enforce relational constraints |
| Prisma + PlanetScale | More moving parts; Prisma migrations separate from auth |

### Key Patterns (from Context7)
```typescript
// lib/supabase/server.ts — used in RSC + Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
      },
    }
  )
}
```

```sql
-- RLS: public reads only published, non-deleted posts
create policy "public_read_posts"
  on public.posts for select
  using (status = 'published' and deleted_at is null);

-- RLS: only authenticated users can insert/update posts
create policy "authors_write_posts"
  on public.posts for insert
  with check (auth.uid() = author_id);
```

### Auth Flow
```
1. Author visits /admin/login → Supabase signInWithPassword()
2. Supabase sets httpOnly session cookie
3. middleware.ts reads cookie via @supabase/ssr → if no session, redirect /admin/login
4. Authenticated Route Handlers use server client (session from cookie)
5. On logout: Supabase signOut() → cookie cleared → middleware redirects
```

---

## 5. Markdown Rendering

### Decision
**`marked`** (parse Markdown → HTML) + **`DOMPurify`** (sanitise HTML, strip
`<script>`, `<iframe>`, `onclick`, etc.). Runs on the server inside a Server
Component — no client-side Markdown parsing.

### Rationale
- Server-side rendering means raw Markdown is never sent to the browser.
- DOMPurify is the industry standard for XSS-safe HTML output.
- `isomorphic-dompurify` works in Node.js (server) without a DOM shim.

### Implementation
```typescript
// lib/utils/markdown.ts
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw) as string
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload'],
  })
}
```

---

## 6. Slug Generation

### Decision
Pure function in `lib/utils/slug.ts` — no I/O, fully unit-tested with Vitest.

### Algorithm
1. Lowercase the title.
2. Normalize Unicode (NFD → strip diacritics).
3. Replace non-alphanumeric characters with hyphens.
4. Truncate to 80 characters without breaking words mid-character.
5. Trim leading/trailing hyphens.
6. Append `-2`, `-3`, … for duplicates (collision detection in the DB query
   layer, not in the pure function).

```typescript
// lib/utils/slug.ts
export function generateSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}
```

---

## 7. Vercel Deployment

### Decision
Deploy to **Vercel** — zero-config for Next.js. Use **Incremental Static
Regeneration (ISR)** on public pages with `revalidatePath()` calls from Server
Actions to invalidate cache on publish/unpublish/update.

### Rationale
- Vercel automatically handles serverless function bundling, Edge Middleware,
  and CDN caching for Next.js.
- ISR gives CDN-speed public pages without stale data — `revalidatePath('/')`
  after publish immediately invalidates the home page cache.
- Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
  set in Vercel dashboard → no secrets in repo.

### Environment Variables
```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only, never exposed to browser
```

### Deployment checklist
- `vercel env pull .env.local` syncs secrets locally.
- `supabase db push` applies migrations to the linked Supabase project.
- `supabase gen types typescript > src/types/database.types.ts` regenerated
  after every migration.
- Preview deployments on every PR via Vercel GitHub integration.

---

## 8. Testing Strategy

| Layer | Tool | What it covers |
|---|---|---|
| Unit | Vitest | `generateSlug`, `renderMarkdown`, Zod validation schemas |
| Component | Vitest + RTL | PostCard, CommentForm (submit + validation error states) |
| Integration | Vitest + Supabase test DB | Route Handlers (comment submit, admin CRUD) |
| E2E | Playwright | Full user journeys: P1 home timeline, P2 publish, P4 comment, P5 moderation |

**Note**: Every new feature requires tests before merge (constitution gate).

---

## Summary of Decisions

| Topic | Decision | Confidence |
|---|---|---|
| Framework | Next.js 15 App Router | High |
| Language | TypeScript 5 strict | High |
| Styling | Tailwind CSS 3 + shadcn/ui | High |
| Database | Supabase (PostgreSQL + RLS) | High |
| Auth | Supabase Auth (email/password) | High |
| SSR client | @supabase/ssr | High |
| Markdown | marked + isomorphic-dompurify | High |
| Slug | Pure TS function | High |
| Deployment | Vercel ISR | High |
| Testing | Vitest + RTL + Playwright | High |
