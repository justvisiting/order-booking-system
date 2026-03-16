import { test, expect } from '@playwright/test'
import { screenshotStep } from './helpers'

test.describe('TC-01: Product Catalog', () => {
  test('TC-01.1: Display product catalog with all categories', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Verify products loaded
    const productCards = page.locator('.bg-white.rounded-xl.shadow-sm.border')
    await expect(productCards.first()).toBeVisible({ timeout: 5000 })

    // Verify category filter buttons exist
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Fruits' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Vegetables' })).toBeVisible()

    await screenshotStep(page, '01-01-product-catalog-loaded')
  })

  test('TC-01.2: Filter products by category', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()
    await page.locator('.bg-white.rounded-xl.shadow-sm.border').first().waitFor()

    // Click Fruits filter
    await page.getByRole('button', { name: 'Fruits' }).click()
    await page.waitForTimeout(300)
    await screenshotStep(page, '01-02-filtered-by-fruits')

    // Verify only fruit products are shown
    const cards = page.locator('.grid .bg-white.rounded-xl')
    const count = await cards.count()
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText('Fruits')
    }
  })

  test('TC-01.3: Search products by name', async ({ page }) => {
    await page.goto('/order')
    await page.locator('.bg-white.rounded-xl.shadow-sm.border').first().waitFor()

    await page.getByPlaceholder('Search products...').fill('Milk')
    await page.waitForTimeout(300)
    await screenshotStep(page, '01-03-search-milk')

    // Should find milk product
    await expect(page.locator('.grid .bg-white.rounded-xl')).toHaveCount(1)
    await expect(page.getByText('Milk')).toBeVisible()
  })

  test('TC-01.4: Add product to cart', async ({ page }) => {
    await page.goto('/order')
    await page.locator('.bg-white.rounded-xl.shadow-sm.border').first().waitFor()

    // Add first product
    const firstCard = page.locator('.grid .bg-white.rounded-xl').first()
    await firstCard.getByRole('button', { name: 'Add to Cart' }).click()

    // Cart badge should appear in header
    await expect(page.locator('header span.bg-blue-600')).toHaveText('1')
    await screenshotStep(page, '01-04-product-added-to-cart')
  })
})
