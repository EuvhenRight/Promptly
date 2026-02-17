import { test, expect } from '@playwright/test'

test.describe('Cart page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cart', { waitUntil: 'domcontentloaded', timeout: 15_000 })
  })

  test('cart page loads', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveURL(/\/cart/)
  })
})
