import { test, expect } from '@playwright/test'

/**
 * E2E: Comment moderation — submit 2 comments, approve first, reject second,
 * verify only approved comment visible on post page.
 * Requires a live Supabase instance, a published post with a known slug,
 * and admin credentials in ADMIN_EMAIL/ADMIN_PASSWORD env.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'password'

// Use the first published post from the seed data
const TEST_POST_SLUG = process.env.TEST_POST_SLUG ?? 'getting-started-with-nextjs'

test.describe('Comment moderation (US4+US5)', () => {
  test('reader submits comment — appears pending, not public', async ({ page }) => {
    await page.goto(`/posts/${TEST_POST_SLUG}`)

    // Submit a comment
    await page.fill('#author_name', 'E2E Tester')
    await page.fill('#author_email', 'e2e@example.com')
    await page.fill('#comment_body', 'This is an automated E2E test comment.')
    await page.click('button[type="submit"]')

    // Success message appears
    await expect(page.locator('text=awaiting moderation')).toBeVisible({ timeout: 8_000 })

    // Comment body NOT visible publicly yet
    await expect(
      page.locator('text=This is an automated E2E test comment.'),
    ).not.toBeVisible()
  })

  test('admin approves first comment, rejects second, only approved visible', async ({
    page,
  }) => {
    // Submit 2 comments via the API directly to avoid flakiness
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

    // Get post_id from the slug (we use the API to submit comments)
    // In a real setup you'd fetch the post_id first; here we stub with env
    const postId = process.env.TEST_POST_ID
    if (!postId) {
      test.skip(true, 'TEST_POST_ID env not set — skipping full moderation flow')
      return
    }

    for (const body of ['First approved comment', 'Second rejected comment']) {
      await fetch(`${baseUrl}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          author_name: 'E2E Test',
          author_email: 'e2e@test.com',
          body,
        }),
      })
    }

    // Log in to admin
    await page.goto('/admin/login')
    await page.fill('[name="email"], input[type="email"]', ADMIN_EMAIL)
    await page.fill('[name="password"], input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin\/posts/, { timeout: 10_000 })

    // Go to comments moderation
    await page.goto('/admin/comments')

    // Approve first
    const firstRow = page.locator('div', { hasText: 'First approved comment' })
    await firstRow.locator('button', { hasText: 'Approve' }).click()
    await page.waitForTimeout(1_000)

    // Reject second
    const secondRow = page.locator('div', { hasText: 'Second rejected comment' })
    await secondRow.locator('button', { hasText: 'Reject' }).click()
    await page.waitForTimeout(1_000)

    // Visit post page — only approved comment should be visible
    await page.goto(`/posts/${TEST_POST_SLUG}`)
    await expect(page.locator('text=First approved comment')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('text=Second rejected comment')).not.toBeVisible()
  })
})
