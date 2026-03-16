# 🚢 Deployment (Vercel)

## Live Demo

🔗 https://project-0e66m-79lo03ksi-chuhangpt96-8349s-projects.vercel.app

---

## Deploy lên Vercel

### Bước 1: Push code lên GitHub

```bash
git add .
git commit -m "feat: initial release"
git push origin main
```

### Bước 2: Import project trên Vercel

1. Vào [vercel.com](https://vercel.com) → **New Project**
2. Import GitHub repository
3. Framework Preset: chọn **Next.js**
4. Click **Deploy**

### Bước 3: Thêm Environment Variables

Vào **Vercel Dashboard → Project → Settings → Environment Variables**, thêm:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL từ Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key từ Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) |

Lấy giá trị tại: **Supabase Dashboard → Settings → API**

### Bước 4: Push Supabase migrations lên production

```bash
# Liên kết với Supabase project production
supabase link --project-ref <your-project-ref>

# Apply tất cả migrations
supabase db push
```

### Bước 5: Deploy ✅

Vercel tự động deploy mỗi khi push lên branch `main`.

---

## Cấu hình Vercel tự động

| Setting | Value |
|---------|-------|
| Build Command | `pnpm build` |
| Output Directory | `.next` |
| Install Command | `pnpm install` |
| Node.js Version | 20.x |

---

## ISR (Incremental Static Regeneration)

Các public pages sử dụng ISR để cân bằng giữa tốc độ và freshness:

| Route | Revalidate |
|-------|-----------|
| `/` | 60s |
| `/posts/[slug]` | 60s |
| `/tags/[slug]` | 60s |

Admin pages không dùng cache (dynamic rendering).

---

## Custom Domain

1. Vercel Dashboard → Project → Settings → **Domains**
2. Thêm domain của bạn
3. Cập nhật DNS records theo hướng dẫn của Vercel

---

## Supabase Production Setup

1. Tạo project mới tại [supabase.com](https://supabase.com)
2. Lấy URL và keys từ **Settings → API**
3. Tạo admin user:
   - Vào **Authentication → Users → Invite user**
   - Hoặc dùng Supabase SQL Editor để insert trực tiếp

```sql
-- Tạo admin user thủ công (chạy trong Supabase SQL Editor)
INSERT INTO auth.users (email, encrypted_password, ...)
-- Hoặc dùng Supabase Auth UI để invite user
```
