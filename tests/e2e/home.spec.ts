import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('loads and has main content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    await expect(page).toHaveURL('/')
    await expect(page.locator('body')).toBeVisible()
  })

  test('has header with logo', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    const header = page.locator('header').first()
    await expect(header).toBeVisible({ timeout: 10_000 })
    const logo = page.getByRole('link', { name: /Promptly/i }).first()
    await expect(logo).toBeVisible({ timeout: 10_000 })
  })

  test('has footer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    const footer = page.locator('footer')
    await expect(footer).toBeVisible({ timeout: 10_000 })
  })
})
