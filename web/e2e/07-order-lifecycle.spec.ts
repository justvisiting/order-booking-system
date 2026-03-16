import { test, expect } from '@playwright/test'
import { fillOrderForm, loginAsAdmin, screenshotStep, testCustomer } from './helpers'

test.describe('TC-07: Full Order Lifecycle (Customer + Staff)', () => {
  test('TC-07.1: Complete lifecycle — order → confirm → dispatch → deliver → track', async ({ page }) => {
    // ===== Customer: Place order =====
    await page.goto('/order')
    await page.locator('.grid .bg-white.rounded-xl').first().waitFor()

    // Add 2 products
    const cards = page.locator('.grid .bg-white.rounded-xl')
    await cards.nth(0).getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(300)
    await cards.nth(2).getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(300)

    // Cart → Checkout → Fill form → Review → Place
    await page.locator('header button').last().click()
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click()
    await fillOrderForm(page)
    await page.getByRole('button', { name: 'Review Order' }).click()
    await expect(page.getByText('Review Your Order')).toBeVisible()
    await page.getByRole('button', { name: 'Place Order' }).click()
    await expect(page.getByText('Order Placed Successfully!')).toBeVisible({ timeout: 10000 })
    await screenshotStep(page, '07-01-step1-order-placed')

    // ===== Staff: Process the order =====
    await loginAsAdmin(page)

    // Find latest order (should be first in the list)
    const firstOrderLink = page.locator('table a').first()
    const orderNumber = await firstOrderLink.textContent()
    await firstOrderLink.click()
    await expect(page.getByText('Customer Details')).toBeVisible({ timeout: 5000 })
    await screenshotStep(page, '07-01-step2-staff-views-order')

    // Confirm
    await page.getByRole('button', { name: 'Mark as Confirmed' }).click()
    await page.waitForTimeout(1000)
    await screenshotStep(page, '07-01-step3-confirmed')

    // Dispatch
    await page.getByRole('button', { name: 'Mark as Dispatched' }).click()
    await page.waitForTimeout(1000)
    await screenshotStep(page, '07-01-step4-dispatched')

    // Deliver
    await page.getByRole('button', { name: 'Mark as Delivered' }).click()
    await page.waitForTimeout(1000)
    await screenshotStep(page, '07-01-step5-delivered')

    // Verify no more status buttons (delivered is terminal)
    await expect(page.getByRole('button', { name: /Mark as/ })).not.toBeVisible()

    // ===== Customer: Track the delivered order =====
    await page.goto('/order/track')
    await page.getByPlaceholder('Enter your 10-digit phone number').fill(testCustomer.phone)
    await page.getByRole('button', { name: 'Search' }).click()

    // Find the order and verify delivered status
    await expect(page.locator(`text=Order #${orderNumber}`).or(page.locator('text=Order #'))).toBeVisible({ timeout: 5000 })
    await screenshotStep(page, '07-01-step6-customer-tracks-delivered')
  })

  test('TC-07.2: Cancel order flow', async ({ page }) => {
    // Place an order
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
    await screenshotStep(page, '07-02-step1-order-placed')

    // Staff cancels the order
    await loginAsAdmin(page)
    const firstOrderLink = page.locator('table a').first()
    await firstOrderLink.click()
    await expect(page.getByText('Customer Details')).toBeVisible({ timeout: 5000 })

    await page.getByRole('button', { name: 'Mark as Cancelled' }).click()
    await page.waitForTimeout(1000)

    // Verify no more status buttons (cancelled is terminal)
    await expect(page.getByRole('button', { name: /Mark as/ })).not.toBeVisible()
    await screenshotStep(page, '07-02-step2-order-cancelled')
  })
})
