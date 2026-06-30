import { test, expect } from '@playwright/test'

test.describe('Community page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/community', { waitUntil: 'domcontentloaded', timeout: 15_000 })
  })

  test('page loads with main content', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/community/)
  })
})
