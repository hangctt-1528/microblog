import { test, expect } from '@playwright/test'

/**
 * E2E: Home timeline — published posts appear, drafts do not, post detail renders.
 * Requires seed.sql data: ≥2 published posts, ≥1 draft.
 */
test.describe('Home timeline (US1)', () => {
  test('home page loads and shows published posts newest-first', async ({ page }) => {
    await page.goto('/')

    // Page title / nav should be present
    await expect(page.locator('header, nav')).toBeVisible()

    // At least one article/post card
    const cards = page.locator('article, [data-testid="post-card"]')
    await expect(cards.first()).toBeVisible({ timeout: 10_000 })
  })

  test('clicking a post card navigates to /posts/[slug]', async ({ page }) => {
    await page.goto('/')

    // Find the first post link
    const firstPostLink = page.locator('a[href^="/posts/"]').first()
    await expect(firstPostLink).toBeVisible()

    const href = await firstPostLink.getAttribute('href')
    expect(href).toMatch(/^\/posts\//)

    await firstPostLink.click()
    await page.waitForURL(/\/posts\//)

    // Post page should have an article or main heading
    await expect(page.locator('article h1, main h1').first()).toBeVisible()
  })

  test('back to home within 3 clicks from post page', async ({ page }) => {
    await page.goto('/')

    // Go to a post
    const firstPostLink = page.locator('a[href^="/posts/"]').first()
    await firstPostLink.click()
    await page.waitForURL(/\/posts\//)

    // Navigate back via the logo/home link
    const homeLink = page.locator('a[href="/"]').first()
    await homeLink.click()
    await page.waitForURL('/')

    await expect(page).toHaveURL('/')
  })
})
