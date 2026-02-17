import { test, expect } from '@playwright/test'

test.describe('Docs pages', () => {
  test('docs overview loads', async ({ page }) => {
    await page.goto('/docs', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    await expect(page).toHaveURL(/\/(docs|docs\/overview)/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('docs testing page loads', async ({ page }) => {
    await page.goto('/docs/testing', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    await expect(page).toHaveURL(/\/docs\/testing/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('docs overview link in sidebar', async ({ page }) => {
    await page.goto('/docs/testing', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    const overviewLink = page.getByRole('link', { name: /Огляд|Overview/i })
    await expect(overviewLink.first()).toBeVisible({ timeout: 10_000 })
  })

  test('click Архітектура navigates to docs/architecture', async ({ page }) => {
    await page.goto('/docs', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    const archLink = page.getByRole('link', { name: 'Архітектура' })
    await expect(archLink.first()).toBeVisible({ timeout: 10_000 })
    await archLink.first().click()
    await expect(page).toHaveURL(/\/docs\/architecture/)
  })

  test('click Тестування navigates to docs/testing', async ({ page }) => {
    await page.goto('/docs', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    const testingLink = page.getByRole('link', { name: 'Тестування' })
    await expect(testingLink.first()).toBeVisible({ timeout: 10_000 })
    await testingLink.first().click()
    await expect(page).toHaveURL(/\/docs\/testing/)
  })

  test('click Frontend navigates to docs/frontend', async ({ page }) => {
    await page.goto('/docs', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    const frontendLink = page.getByRole('link', { name: 'Frontend' })
    await expect(frontendLink.first()).toBeVisible({ timeout: 10_000 })
    await frontendLink.first().click()
    await expect(page).toHaveURL(/\/docs\/frontend/)
  })
})
