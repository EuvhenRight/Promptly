import { test, expect } from '@playwright/test'

test.describe('Plans page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plans', { waitUntil: 'domcontentloaded', timeout: 15_000 })
  })

  test('page loads and shows plans content', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveURL(/\/plans/)
  })

  test('has Choose Your Plan heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Choose Your Plan/i })
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })

  test('has Monthly and Yearly toggle buttons', async ({ page }) => {
    const monthly = page.getByRole('button', { name: 'Monthly' })
    const yearly = page.getByRole('button', { name: 'Yearly' })
    await expect(monthly).toBeVisible({ timeout: 10_000 })
    await expect(yearly).toBeVisible({ timeout: 10_000 })
  })
})
