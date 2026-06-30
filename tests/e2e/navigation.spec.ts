import { test, expect } from '@playwright/test'

test.describe('Header navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 })
  })

  test('logo link goes to home', async ({ page }) => {
    const logo = page.getByRole('link', { name: /Promptly/i }).first()
    await expect(logo).toBeVisible({ timeout: 10_000 })
    await logo.click()
    await expect(page).toHaveURL('/')
  })

  test('Pricing link goes to plans', async ({ page }) => {
    const pricing = page.getByRole('link', { name: 'Pricing' })
    await expect(pricing.first()).toBeVisible({ timeout: 10_000 })
    await pricing.first().click()
    await expect(page).toHaveURL(/\/plans/)
  })

  test('Community link goes to community', async ({ page }) => {
    const community = page.getByRole('link', { name: 'Community' })
    await expect(community.first()).toBeVisible({ timeout: 10_000 })
    await community.first().click()
    await expect(page).toHaveURL(/\/community/)
  })

  test('Sign In button exists (when not logged in)', async ({ page }) => {
    const signIn = page.getByRole('button', { name: 'Sign In' })
    await expect(signIn).toBeVisible({ timeout: 10_000 })
  })

  test('Cart link or icon exists', async ({ page }) => {
    const cartLink = page.getByRole('link', { name: /Cart/i }).or(
      page.locator('a[href="/cart"]')
    )
    await expect(cartLink.first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Footer navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 })
  })

  test('footer docs link goes to docs', async ({ page }) => {
    const docsLink = page.getByRole('link', { name: 'Документація' })
    await expect(docsLink).toBeVisible({ timeout: 10_000 })
    await docsLink.click()
    await expect(page).toHaveURL(/\/(docs|docs\/overview)/)
  })
})
