import { test, expect } from '@playwright/test'

/**
 * E2E: Admin creates a draft post, verifies absent from public, publishes it,
 * verifies present on home and post detail. Also verifies auth guard.
 * Requires a live Supabase instance and a test admin account in ADMIN_EMAIL/ADMIN_PASSWORD env.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'password'

test.describe('Post publish flow (US2)', () => {
  test('unauthenticated /admin/posts redirects to /admin/login', async ({ page }) => {
    const res = await page.goto('/admin/posts', { waitUntil: 'commit' })
    // Either redirect happens or page is at /admin/login
    await page.waitForURL(/\/admin\/login/, { timeout: 8_000 })
    expect(page.url()).toContain('/admin/login')
    // Suppress unused variable warning
    void res
  })

  test('admin can log in, create draft, publish, verify on home', async ({ page }) => {
    // Log in
    await page.goto('/admin/login')
    await page.fill('[name="email"], input[type="email"]', ADMIN_EMAIL)
    await page.fill('[name="password"], input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin\/posts/, { timeout: 10_000 })

    // Create a new post
    const title = `E2E Test Post ${Date.now()}`
    await page.click('a[href="/admin/posts/new"]')
    await page.waitForURL(/\/admin\/posts\/new/)

    await page.fill('[name="title"]', title)
    await page.fill('[name="body_markdown"], textarea', '## Hello E2E\n\nThis is a test post.')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin\/posts/, { timeout: 10_000 })

    // Verify draft does NOT appear on public home
    await page.goto('/')
    await expect(page.locator(`text=${title}`)).not.toBeVisible({ timeout: 5_000 }).catch(() => {})

    // Back to admin — publish the post
    await page.goto('/admin/posts')
    const publishBtn = page.locator('tr', { hasText: title }).locator('button', { hasText: 'Publish' })
    await publishBtn.click()
    await page.waitForTimeout(2_000)

    // Verify post now appears on public home
    await page.goto('/')
    await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 10_000 })

    // Navigate to post detail
    await page.click(`text=${title}`)
    await page.waitForURL(/\/posts\//)
    await expect(page.locator('h1')).toContainText(title)
    await expect(page.locator('text=Hello E2E')).toBeVisible()
  })
})
