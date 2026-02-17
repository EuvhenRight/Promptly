import { test, expect } from '@playwright/test'

const TIMEOUT = 15_000

test.describe('Prompt detail page', () => {
  test('loads without crash for valid-looking id', async ({ page }) => {
    await page.goto('/prompt/test-id-123', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await expect(page).toHaveURL(/\/prompt\/test-id-123/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('shows rating, ratings count, views, and Add to Favorites when prompt exists', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    // Avoid networkidle - Firebase keeps connections open; rely on prompt link visibility instead

    const promptLink = page.locator('a[href^="/prompt/"]').first()
    if (!(await promptLink.isVisible({ timeout: 8_000 }).catch(() => false))) {
      test.skip()
      return
    }

    await promptLink.click()
    await expect(page).toHaveURL(/\/prompt\//)
    await page.waitForLoadState('load')

    if (await page.getByText('Prompt not found').isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip()
      return
    }

    await expect(page.getByText(/\d+\.\d/).first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/\(\d+ ratings?\)/)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/views/)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('button', { name: 'Toggle Favorite' })).toBeVisible({ timeout: 5_000 })
  })
})
