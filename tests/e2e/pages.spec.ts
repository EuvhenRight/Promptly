import { test, expect } from '@playwright/test'

/** Test all public pages load without crashing. Timeout 15s per page (Firebase/async). */
const TIMEOUT = 15_000

test.describe('Public pages load', () => {
  test('home page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await expect(page).toHaveURL('/')
    await expect(page.locator('body')).toBeVisible()
  })

  test('plans page', async ({ page }) => {
    await page.goto('/plans', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await expect(page).toHaveURL(/\/plans/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('community page', async ({ page }) => {
    await page.goto('/community', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await expect(page).toHaveURL(/\/community/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('cart page', async ({ page }) => {
    await page.goto('/cart', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await expect(page).toHaveURL(/\/cart/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('checkout page', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('submit page', async ({ page }) => {
    await page.goto('/submit', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await expect(page).toHaveURL(/\/submit/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('docs overview', async ({ page }) => {
    await page.goto('/docs', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await expect(page).toHaveURL(/\/(docs|docs\/overview)/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('docs testing page', async ({ page }) => {
    await page.goto('/docs/testing', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await expect(page).toHaveURL(/\/docs\/testing/)
  })

  test('docs api-spec', async ({ page }) => {
    await page.goto('/docs/api-spec', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await expect(page).toHaveURL(/\/docs\/api-spec/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('checkout return page', async ({ page }) => {
    await page.goto('/checkout/return', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await expect(page).toHaveURL(/\/checkout\/return/)
    await expect(page.locator('body')).toBeVisible()
  })
})
