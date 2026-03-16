# 🛠️ Tech Stack

## Core Technologies

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Database | [Supabase](https://supabase.com) (PostgreSQL 15 + RLS) |
| Auth | Supabase Auth (email/password, cookie session) |
| Deployment | [Vercel](https://vercel.com) (ISR + Edge CDN) |
| Testing | Vitest (unit) + Playwright (E2E) |
| Package Manager | pnpm |
| AI Assistant | [GitHub Copilot](https://github.com/features/copilot) (code generation, spec writing) |
| MCP Servers | [GitHub MCP](https://github.com/github/github-mcp-server) · [Context7](https://context7.com) |

---

## 🤖 AI Agents & MCP Servers

Dự án được phát triển với sự hỗ trợ của các AI agent và MCP server sau:

### AI Tools

| Tool | Vai trò |
|------|---------|
| **[GitHub Copilot](https://github.com/features/copilot)** | Sinh code, viết spec, đề xuất kiến trúc, hỗ trợ toàn bộ quá trình phát triển |

### MCP Servers

| MCP Server | Mục đích sử dụng |
|------------|-----------------|
| **[GitHub MCP Server](https://github.com/github/github-mcp-server)** | Tương tác với GitHub API: tìm kiếm code, tạo issue, quản lý pull request trực tiếp từ AI agent |
| **[Context7](https://context7.com)** | Tra cứu tài liệu thư viện cập nhật (Next.js, Supabase, shadcn/ui...) trong thời gian thực để sinh code chính xác |

---

## Chi tiết từng thành phần

### Next.js 15 (App Router)
- Server Components (RSC) cho public pages → SEO tốt, tải nhanh
- Server Actions cho admin form submissions
- Turbopack cho dev server tốc độ cao
- ISR (Incremental Static Regeneration) khi deploy lên Vercel

### Supabase (PostgreSQL 15 + RLS)
- Row Level Security đảm bảo dữ liệu an toàn ở tầng DB
- Supabase Auth quản lý session bằng cookie bảo mật
- Trigger tự động tạo profile khi admin đăng ký tài khoản

### Tailwind CSS 3 + shadcn/ui
- Utility-first CSS, không cần viết CSS thuần
- shadcn/ui cung cấp các component đẹp, accessible, dễ tùy chỉnh

### Vitest + Playwright
- **Vitest**: unit test cho utilities (slug, markdown, validation)
- **Playwright**: E2E test tự động hóa toàn bộ user flow
