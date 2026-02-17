import { test, expect } from '@playwright/test'

/** Submit page redirects to home when not logged in. */
test.describe('Submit page', () => {
  test('loads without crash (may redirect to home when not logged in)', async ({ page }) => {
    await page.goto('/submit', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    await expect(page.locator('body')).toBeVisible()
  })
})
