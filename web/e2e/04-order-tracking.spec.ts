import { test, expect } from '@playwright/test'
import { fillOrderForm, screenshotStep, testCustomer } from './helpers'

test.describe('TC-04: Order Tracking', () => {
  test('TC-04.1: Place order then track by phone number', async ({ page }) => {
    // First place an order
    await page.goto('/order')
    await page.locator('.grid .bg-white.rounded-xl').first().waitFor()
    await page.locator('.grid .bg-white.rounded-xl').first().getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(300)
    await page.locator('header button').last().click()
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click()
    await fillOrderForm(page)
    await page.getByRole('button', { name: 'Review Order' }).click()
    await page.getByRole('button', { name: 'Place Order' }).click()
    await expect(page.getByText('Order Placed Successfully!')).toBeVisible({ timeout: 10000 })
    await screenshotStep(page, '04-01-step1-order-placed')

    // Now track the order
    await page.goto('/order/track')
    await expect(page.getByText('Track Your Orders')).toBeVisible()
    await screenshotStep(page, '04-01-step2-track-page')

    await page.getByPlaceholder('Enter your 10-digit phone number').fill(testCustomer.phone)
    await page.getByRole('button', { name: 'Search' }).click()

    // Should find at least one order
    await expect(page.locator('text=Order #')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.bg-white.rounded-xl').filter({ hasText: 'Order #' }).first()).toBeVisible()
    await screenshotStep(page, '04-01-step3-orders-found')
  })

  test('TC-04.2: Track with invalid phone shows error', async ({ page }) => {
    await page.goto('/order/track')
    await page.getByPlaceholder('Enter your 10-digit phone number').fill('123')
    await page.getByRole('button', { name: 'Search' }).click()

    await expect(page.getByText('Enter a valid 10-digit phone number')).toBeVisible()
    await screenshotStep(page, '04-02-invalid-phone')
  })

  test('TC-04.3: Track with unknown phone shows no orders', async ({ page }) => {
    await page.goto('/order/track')
    await page.getByPlaceholder('Enter your 10-digit phone number').fill('1111111111')
    await page.getByRole('button', { name: 'Search' }).click()

    await expect(page.getByText('No orders found')).toBeVisible({ timeout: 5000 })
    await screenshotStep(page, '04-03-no-orders-found')
  })
})
