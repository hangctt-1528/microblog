# Quickstart: Microblog Web App

**Feature**: `001-microblog-web-app`  
**Stack**: Next.js 15 · TypeScript 5 · Tailwind CSS 3 · Supabase · Vercel  
**Date**: 2026-03-15

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS | https://nodejs.org |
| pnpm | 9.x | `npm i -g pnpm` |
| Supabase CLI | latest | `brew install supabase/tap/supabase` or `npx supabase` |
| Git | 2.x+ | system |

---

## 1. Bootstrap the Next.js Project

```bash
# From repo root
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

This generates:
- `src/app/` — App Router entry point
- `tailwind.config.ts` — pre-configured for `src/app/**`
- `tsconfig.json` — strict mode, `@/*` path alias

---

## 2. Install Dependencies

```bash
# Core
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add marked isomorphic-dompurify
pnpm add zod

# Shadcn/ui (component primitives)
pnpm dlx shadcn@latest init
# Choose: TypeScript, default style, src/components/ui

# Add components you need
pnpm dlx shadcn@latest add button input badge textarea label

# Dev / test
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event
pnpm add -D @playwright/test
pnpm add -D supabase    # Supabase CLI as dev dep (optional, can use npx)
```

---

## 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Never expose in browser
```

> Get these from **Supabase Dashboard → Project Settings → API**.

---

## 4. Set Up Supabase Locally

```bash
# Initialise local Supabase (creates supabase/ directory)
supabase init

# Link to your remote project
supabase link --project-ref <project-ref>

# Start local Supabase stack (Docker required)
supabase start
```

Local services:
- Postgres: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio:   `http://localhost:54323`

---

## 5. Run Database Migrations

```bash
# Apply migrations to local Supabase
supabase db push

# After every migration: regenerate TypeScript types
supabase gen types typescript --local > src/types/database.types.ts
```

Migration files live in `supabase/migrations/`:
1. `20260315000001_initial_schema.sql` — tables, indexes, check constraints
2. `20260315000002_rls_policies.sql`   — Row Level Security policies

---

## 6. Wire Up Supabase Clients

### `src/lib/supabase/server.ts`

```typescript
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
        setAll: (cs) =>
          cs.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)),
      },
    }
  )
}
```

### `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## 7. Add Auth Middleware

### `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cs) =>
          cs.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

---

## 8. Scaffold Key Utilities

### `src/lib/utils/slug.ts`

```typescript
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

### `src/lib/utils/markdown.ts`

```typescript
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

## 9. Run Development Server

```bash
pnpm dev
```

- App: http://localhost:3000
- Admin CMS: http://localhost:3000/admin

---

## 10. Run Tests

```bash
# Unit tests (slug, markdown, validation)
pnpm vitest run

# Unit tests in watch mode
pnpm vitest

# E2E tests (requires dev server running)
pnpm exec playwright test
```

---

## 11. Deploy to Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Link project to Vercel
vercel link

# Pull environment variables from Vercel
vercel env pull .env.local

# Deploy
vercel deploy --prod
```

**Environment variables** to add in Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Supabase production setup**:
```bash
# Apply migrations to production Supabase
supabase db push --linked

# Regenerate types from production schema
supabase gen types typescript --linked > src/types/database.types.ts
```

---

## 12. Project Structure Reference

```
src/
├── app/
│   ├── page.tsx                      ← / (home timeline)
│   ├── posts/[slug]/page.tsx         ← post detail
│   ├── tags/[slug]/page.tsx          ← tag timeline
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── posts/                    ← CMS post management
│   │   ├── tags/page.tsx             ← CMS tag management
│   │   └── comments/page.tsx         ← comment moderation
│   └── api/
│       ├── comments/route.ts         ← POST (public)
│       └── admin/
│           ├── posts/[id]/route.ts
│           ├── tags/[id]/route.ts
│           └── comments/[id]/route.ts
├── components/
│   ├── ui/                           ← shadcn/ui primitives
│   ├── post/PostCard.tsx
│   ├── post/PostBody.tsx
│   ├── comment/CommentForm.tsx
│   └── admin/PostEditor.tsx
├── lib/
│   ├── supabase/{client,server}.ts
│   ├── utils/{slug,markdown}.ts
│   ├── queries/{posts,tags,comments}.ts
│   └── validations/{post,tag,comment}.ts
├── middleware.ts
└── types/database.types.ts
supabase/
└── migrations/
tests/
├── unit/slug.test.ts
├── unit/markdown.test.ts
└── e2e/home-timeline.spec.ts
```

---

## Common Tasks

| Task | Command |
|------|---------|
| Start dev server | `pnpm dev` |
| Run unit tests | `pnpm vitest run` |
| Run E2E tests | `pnpm exec playwright test` |
| Apply DB migrations (local) | `supabase db push` |
| Regenerate TS types | `supabase gen types typescript --local > src/types/database.types.ts` |
| Deploy to Vercel | `vercel deploy --prod` |
| Open Supabase Studio | `supabase studio` |
