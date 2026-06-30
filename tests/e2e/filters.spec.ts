import { test, expect } from '@playwright/test'

const TIMEOUT = 15_000

test.describe('Home page filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await page.waitForLoadState('networkidle')
  })

  test.describe('SearchBar filters (Type, Model, Sort)', () => {
    test('Type dropdown opens and has All Types option', async ({ page }) => {
      const typeTrigger = page.locator('button:has-text("Type"), button:has-text("All Types"), button:has-text("Images"), button:has-text("Video"), button:has-text("Audio")').first()
      await expect(typeTrigger).toBeVisible({ timeout: 12_000 })
      await typeTrigger.click()
      await expect(page.getByText('All Types', { exact: true })).toBeVisible({ timeout: 5_000 })
    })

    test('select All Types filter', async ({ page }) => {
      const typeTrigger = page.locator('button:has-text("Type"), button:has-text("All Types"), button:has-text("Images")').first()
      await expect(typeTrigger).toBeVisible({ timeout: 12_000 })
      await typeTrigger.click()
      await page.getByText('All Types', { exact: true }).click()
      await expect(page.locator('main')).toBeVisible()
    })

    test('Model dropdown opens and has All Models option', async ({ page }) => {
      const modelTrigger = page.locator('button:has-text("Model"), button:has-text("All Models")').first()
      await expect(modelTrigger).toBeVisible({ timeout: 12_000 })
      await modelTrigger.click()
      await expect(page.getByText('All Models', { exact: true })).toBeVisible({ timeout: 5_000 })
    })

    test('select All Models filter', async ({ page }) => {
      const modelTrigger = page.locator('button:has-text("Model"), button:has-text("All Models")').first()
      await expect(modelTrigger).toBeVisible({ timeout: 12_000 })
      await modelTrigger.click()
      await page.getByText('All Models', { exact: true }).click()
      await expect(page.locator('main')).toBeVisible()
    })

    test('Sort dropdown opens and has sort options', async ({ page }) => {
      const sortTrigger = page.locator('button:has-text("Newest"), button:has-text("Popularity"), button:has-text("Top Rated"), button:has-text("Price")').first()
      await expect(sortTrigger).toBeVisible({ timeout: 12_000 })
      await sortTrigger.click()
      await expect(page.getByText('Sort by').or(page.getByText('Newest'))).toBeVisible({ timeout: 5_000 })
    })

    test('select different sort option', async ({ page }) => {
      const sortTrigger = page.locator('button:has-text("Newest"), button:has-text("Popularity"), button:has-text("Top Rated")').first()
      await expect(sortTrigger).toBeVisible({ timeout: 12_000 })
      await sortTrigger.click()
      const popularity = page.getByText('Popularity', { exact: true })
      if (await popularity.isVisible()) {
        await popularity.click()
      }
      await expect(page.locator('main')).toBeVisible()
    })
  })

  test.describe('SubHeader filters (Featured, Hot, New, Top, Category, Tag, Model)', () => {
    test('main filter links (Featured, Hot, New, Top) are visible and clickable', async ({ page }) => {
      const featured = page.getByRole('link', { name: 'Featured' })
      await expect(featured).toBeVisible({ timeout: 12_000 })
      await featured.click()
      await expect(page).toHaveURL('/')

      const hot = page.getByRole('link', { name: 'Hot' })
      await hot.click()

      const newLink = page.getByRole('link', { name: 'New' })
      await newLink.click()

      const top = page.getByRole('link', { name: 'Top' })
      await top.click()
      await expect(page).toHaveURL('/')
    })

    test('subheader has filter buttons or loading state', async ({ page }) => {
      const hasMainLinks = await page.getByRole('link', { name: 'Featured' }).isVisible()
      expect(hasMainLinks).toBeTruthy()
    })

    test('clicking a subheader filter (category/tag/model) if present', async ({ page }) => {
      const filterButton = page.locator('nav + div button.rounded-full').first()
      if (await filterButton.isVisible({ timeout: 8_000 }).catch(() => false)) {
        await filterButton.click()
        await expect(page.locator('main')).toBeVisible()
      }
    })
  })

  test.describe('Empty state', () => {
    test('main content area is visible', async ({ page }) => {
      await expect(page.locator('main')).toBeVisible({ timeout: 12_000 })
    })

    test('selecting Video or Audio filter shows feed or empty state', async ({ page }) => {
      const typeTrigger = page.locator('button:has-text("Type"), button:has-text("Video"), button:has-text("Audio")').first()
      await expect(typeTrigger).toBeVisible({ timeout: 12_000 })
      await typeTrigger.click()

      const video = page.getByText('Video', { exact: true })
      const audio = page.getByText('Audio', { exact: true })
      const option = (await video.isVisible()) ? video : audio

      if (await option.isVisible()) {
        await option.click()
        await page.waitForLoadState('networkidle')
        const hasEmptyState = await page.getByText('No prompts found').isVisible()
        const hasResults = await page.getByText(/About \d+ results|About 0 results/).isVisible()
        expect(hasEmptyState || hasResults).toBeTruthy()
      }
    })
  })

  test.describe('Search', () => {
    test('search input accepts text', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search for prompts/i)
      await expect(searchInput).toBeVisible({ timeout: 12_000 })
      await searchInput.fill('test')
      await expect(searchInput).toHaveValue('test')
    })

    test('search can be cleared', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search for prompts/i)
      await expect(searchInput).toBeVisible({ timeout: 12_000 })
      await searchInput.fill('xyz')
      await page.waitForTimeout(700) // debounce 500ms
      await searchInput.clear()
      await expect(searchInput).toHaveValue('')
    })
  })
})
