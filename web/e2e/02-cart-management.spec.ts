import { test, expect } from '@playwright/test'
import { addProductToCart, openCart, screenshotStep } from './helpers'

test.describe('TC-02: Cart Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/order')
    await page.locator('.bg-white.rounded-xl.shadow-sm.border').first().waitFor()
  })

  test('TC-02.1: Open cart sidebar with items', async ({ page }) => {
    // Add a product
    const firstCard = page.locator('.grid .bg-white.rounded-xl').first()
    await firstCard.getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(500)

    // Open cart
    await openCart(page)
    await expect(page.getByText('Cart (1 items)')).toBeVisible()
    await screenshotStep(page, '02-01-cart-sidebar-open')
  })

  test('TC-02.2: Increase product quantity in cart', async ({ page }) => {
    // Add a product
    const firstCard = page.locator('.grid .bg-white.rounded-xl').first()
    await firstCard.getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(500)

    await openCart(page)

    // Click + button
    await page.locator('.fixed button:has-text("+")').click()
    await expect(page.locator('.fixed .text-center').first()).toHaveText('2')
    await screenshotStep(page, '02-02-quantity-increased')
  })

  test('TC-02.3: Decrease product quantity in cart', async ({ page }) => {
    // Add a product twice
    const firstCard = page.locator('.grid .bg-white.rounded-xl').first()
    await firstCard.getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(300)
    await firstCard.getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(300)

    await openCart(page)
    await expect(page.locator('.fixed .text-center').first()).toHaveText('2')

    // Click - button
    await page.locator('.fixed button:has-text("-")').click()
    await expect(page.locator('.fixed .text-center').first()).toHaveText('1')
    await screenshotStep(page, '02-03-quantity-decreased')
  })

  test('TC-02.4: Remove item from cart', async ({ page }) => {
    const firstCard = page.locator('.grid .bg-white.rounded-xl').first()
    await firstCard.getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(500)

    await openCart(page)
    await page.getByText('Remove').click()

    await expect(page.getByText('Your cart is empty')).toBeVisible()
    await screenshotStep(page, '02-04-cart-empty-after-remove')
  })

  test('TC-02.5: Proceed to checkout from cart', async ({ page }) => {
    const firstCard = page.locator('.grid .bg-white.rounded-xl').first()
    await firstCard.getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(500)

    await openCart(page)
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click()

    await expect(page.getByText('Delivery Details')).toBeVisible()
    await screenshotStep(page, '02-05-checkout-page')
  })
})
