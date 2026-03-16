import { test, expect } from '@playwright/test'
import { fillOrderForm, screenshotStep, testCustomer, testAddress } from './helpers'

test.describe('TC-03: Order Placement (Full Happy Path)', () => {
  test('TC-03.1: Complete order — catalog to confirmation', async ({ page }) => {
    // Step 1: Browse catalog
    await page.goto('/order')
    await page.locator('.bg-white.rounded-xl.shadow-sm.border').first().waitFor()
    await screenshotStep(page, '03-01-step1-catalog')

    // Step 2: Add multiple products
    const cards = page.locator('.grid .bg-white.rounded-xl')
    await cards.nth(0).getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(300)
    await cards.nth(1).getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(300)
    await screenshotStep(page, '03-01-step2-products-added')

    // Step 3: Open cart and go to checkout
    await page.locator('header button').last().click()
    await expect(page.getByText('Cart (2 items)')).toBeVisible()
    await screenshotStep(page, '03-01-step3-cart-open')

    await page.getByRole('button', { name: 'Proceed to Checkout' }).click()
    await expect(page.getByText('Delivery Details')).toBeVisible()
    await screenshotStep(page, '03-01-step4-checkout-form')

    // Step 4: Fill delivery details
    await fillOrderForm(page)
    await page.getByPlaceholder('Any special instructions...').fill('Please ring the doorbell twice')
    await screenshotStep(page, '03-01-step5-form-filled')

    // Step 5: Review order
    await page.getByRole('button', { name: 'Review Order' }).click()
    await expect(page.getByText('Review Your Order')).toBeVisible()
    await expect(page.getByText(testCustomer.name)).toBeVisible()
    await expect(page.getByText(testCustomer.phone)).toBeVisible()
    await expect(page.getByText(testAddress.city)).toBeVisible()
    await screenshotStep(page, '03-01-step6-order-review')

    // Step 6: Place order
    await page.getByRole('button', { name: 'Place Order' }).click()
    await expect(page.getByText('Order Placed Successfully!')).toBeVisible({ timeout: 10000 })

    // Verify order number is shown
    const orderNumber = page.locator('.text-2xl.font-bold').nth(1)
    await expect(orderNumber).toBeVisible()
    await screenshotStep(page, '03-01-step7-order-confirmation')
  })

  test('TC-03.2: Order form validation — empty fields', async ({ page }) => {
    await page.goto('/order')
    await page.locator('.grid .bg-white.rounded-xl').first().waitFor()

    // Add product and go to checkout
    await page.locator('.grid .bg-white.rounded-xl').first().getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(300)
    await page.locator('header button').last().click()
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click()

    // Submit empty form
    await page.getByRole('button', { name: 'Review Order' }).click()

    // Check validation errors
    await expect(page.getByText('Name is required')).toBeVisible()
    await expect(page.getByText('Phone is required')).toBeVisible()
    await expect(page.getByText('Address is required')).toBeVisible()
    await screenshotStep(page, '03-02-validation-errors')
  })

  test('TC-03.3: Order form validation — invalid phone', async ({ page }) => {
    await page.goto('/order')
    await page.locator('.grid .bg-white.rounded-xl').first().waitFor()
    await page.locator('.grid .bg-white.rounded-xl').first().getByRole('button', { name: 'Add to Cart' }).click()
    await page.waitForTimeout(300)
    await page.locator('header button').last().click()
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click()

    await page.getByPlaceholder('Enter your name').fill('Test')
    await page.getByPlaceholder('10-digit phone number').fill('123')
    await page.getByPlaceholder('House/Flat number, Street, Area').fill('Addr')
    await page.getByPlaceholder('City').fill('City')
    await page.getByPlaceholder('State').fill('State')
    await page.getByPlaceholder('6-digit pincode').fill('123')
    await page.getByRole('button', { name: 'Review Order' }).click()

    await expect(page.getByText('Enter a valid 10-digit phone number')).toBeVisible()
    await expect(page.getByText('Enter a valid 6-digit pincode')).toBeVisible()
    await screenshotStep(page, '03-03-invalid-phone-pincode')
  })
})
