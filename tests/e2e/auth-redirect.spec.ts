import { test, expect } from '@playwright/test'

/** Auth-protected pages: load without crash; may redirect or show content. */
test.describe('Auth-protected pages (no crash)', () => {
  test('account page loads or redirects', async ({ page }) => {
    await page.goto('/account', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('admin page loads or redirects', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    await expect(page.locator('body')).toBeVisible()
  })
})
