# 🚀 Getting Started (Local Development)

## Prerequisites

- **Node.js** 20 LTS
- **pnpm** (`npm i -g pnpm`)
- **Docker** (for Supabase local)
- **Supabase CLI**

---

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. Start local Supabase (PostgreSQL + Auth + Studio)
supabase start

# 4. Apply migrations + seed data
supabase db push

# 5. Generate TypeScript types from DB schema
supabase gen types typescript --local > src/types/database.types.ts

# 6. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Local URLs

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Public site |
| http://localhost:3000/admin | CMS (redirects to login) |
| http://127.0.0.1:54323 | Supabase Studio (local DB) |

---

## Default Seed Credentials

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `password123` |

---

## Environment Variables

Tạo file `.env.local` ở root project với nội dung:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon / public key
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # secret — never expose to browser
```

Lấy các giá trị này từ: **Supabase Dashboard → Settings → API**

> ⚠️ **Lưu ý bảo mật:** `SUPABASE_SERVICE_ROLE_KEY` có toàn quyền truy cập DB. Không bao giờ expose key này ra phía browser hoặc commit lên Git.

---

## Cài đặt Supabase CLI

```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# Linux
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh

# Kiểm tra cài đặt thành công
supabase --version
```

---

## Database Migrations

```bash
# Xem trạng thái migration hiện tại
supabase migration list

# Tạo migration mới
supabase migration new <tên_migration>

# Apply tất cả migrations lên local DB
supabase db push

# Reset DB về trạng thái ban đầu (có seed data)
supabase db reset
```

---

## Useful Commands

```bash
# Dev server với Turbopack
pnpm dev

# Build production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# TypeScript type check
pnpm tsc --noEmit

# Generate Supabase types
supabase gen types typescript --local > src/types/database.types.ts
```
