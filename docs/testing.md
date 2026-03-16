# 🧪 Testing

## Overview

| Loại | Framework | Phạm vi |
|------|-----------|---------|
| Unit tests | [Vitest](https://vitest.dev) | Utilities, validations, queries |
| E2E tests | [Playwright](https://playwright.dev) | User flows end-to-end |

---

## Unit Tests (Vitest)

### Chạy tests

```bash
# Chạy một lần
pnpm vitest run

# Watch mode (tự reload khi file thay đổi)
pnpm vitest

# Với coverage report
pnpm vitest run --coverage
```

### Test files

| File | Nội dung test |
|------|---------------|
| `tests/unit/slug.test.ts` | `generateSlug()` — chuyển text → slug |
| `tests/unit/markdown.test.ts` | `markdownToHtml()` — render Markdown → HTML |
| `tests/unit/comment-validation.test.ts` | Zod schema validation cho comment form |
| `tests/unit/post-queries.test.ts` | Query functions cho posts |

### Ví dụ: slug.test.ts

```typescript
import { generateSlug } from '@/lib/utils/slug'

describe('generateSlug', () => {
  it('converts spaces to hyphens', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world')
  })
})
```

---

## E2E Tests (Playwright)

### Yêu cầu

Dev server phải đang chạy trước khi chạy E2E tests:

```bash
# Terminal 1: chạy dev server
pnpm dev

# Terminal 2: chạy E2E tests
pnpm exec playwright test
```

### Test files

| File | User flow |
|------|-----------|
| `tests/e2e/home-timeline.spec.ts` | Xem danh sách bài viết trang chủ |
| `tests/e2e/post-publish.spec.ts` | Admin tạo và xuất bản bài viết |
| `tests/e2e/comment-moderation.spec.ts` | Admin duyệt/từ chối bình luận |

### Chạy E2E tests

```bash
# Chạy tất cả
pnpm exec playwright test

# Chạy một file cụ thể
pnpm exec playwright test tests/e2e/home-timeline.spec.ts

# Chạy có UI (headed mode)
pnpm exec playwright test --headed

# Xem HTML report
pnpm exec playwright show-report
```

---

## Playwright Config

Xem cấu hình tại [`playwright.config.ts`](../playwright.config.ts):

- Base URL: `http://localhost:3000`
- Browsers: Chromium (default)
- Timeout: 30s per test

---

## TypeScript Check

```bash
# Kiểm tra type errors toàn bộ project
pnpm tsc --noEmit
```

---

## CI/CD

Khi push code lên GitHub, các tests sẽ tự động chạy:
1. `pnpm tsc --noEmit` — TypeScript type check
2. `pnpm vitest run` — Unit tests
3. `pnpm exec playwright test` — E2E tests (với dev server)
