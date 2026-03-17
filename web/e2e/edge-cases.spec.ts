import { test, expect } from '@playwright/test'
import { addProductToCart, openCart, screenshot } from './helpers'

test.describe('Edge Cases & Error Handling', () => {
  test('E2E-021: Empty cart submission blocked', async ({ page }) => {
    // Navigate directly to checkout with empty cart
    await page.goto('/order/checkout')
    await screenshot(page, 'E2E-021', 1, 'empty-cart-redirect')

    // The app redirects to /order when cart is empty (client-side navigate)
    // Wait for the redirect to happen
    await page.waitForURL(/\/order/, { timeout: 10000 })
    await expect(page.getByText('Our Products')).toBeVisible()
    await screenshot(page, 'E2E-021', 2, 'redirected-to-catalog')
  })

  test('E2E-022: Invalid phone rejected', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Add a product to cart
    const productName = await page
      .locator('.bg-white.rounded-xl .font-semibold.text-gray-900')
      .first()
      .textContent()
    await addProductToCart(page, productName!)
    await openCart(page)
    await page.getByRole('button', { name: /Checkout/i }).click()
    await expect(page.getByText('Delivery Details')).toBeVisible()

    // Fill form with invalid phone
    await page.getByPlaceholder('Enter your name').fill('Test User')
    await page.getByPlaceholder('10-digit phone number').fill('12345') // Only 5 digits
    await page.getByPlaceholder('House/Flat number, Street, Area').fill('123 Street')
    await page.getByPlaceholder('City').fill('Mumbai')
    await page.getByPlaceholder('State').fill('Maharashtra')
    await page.getByPlaceholder('6-digit pincode').fill('400001')
    await screenshot(page, 'E2E-022', 1, 'invalid-phone-entered')

    // Submit form
    await page.getByRole('button', { name: 'Review Order' }).click()

    // Verify phone validation error
    await expect(page.getByText('Enter a valid 10-digit phone number')).toBeVisible()
    await screenshot(page, 'E2E-022', 2, 'phone-error-shown')

    // Should still be on checkout page
    await expect(page.getByText('Delivery Details')).toBeVisible()
  })

  test('E2E-028: Missing required fields show errors', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Add a product to cart
    const productName = await page
      .locator('.bg-white.rounded-xl .font-semibold.text-gray-900')
      .first()
      .textContent()
    await addProductToCart(page, productName!)
    await openCart(page)
    await page.getByRole('button', { name: /Checkout/i }).click()
    await expect(page.getByText('Delivery Details')).toBeVisible()
    await screenshot(page, 'E2E-028', 1, 'empty-form')

    // Submit empty form
    await page.getByRole('button', { name: 'Review Order' }).click()
    await screenshot(page, 'E2E-028', 2, 'validation-errors')

    // Verify all required field errors appear
    await expect(page.getByText('Name is required')).toBeVisible()
    await expect(page.getByText('Phone is required')).toBeVisible()
    await expect(page.getByText('Address is required')).toBeVisible()
    await expect(page.getByText('City is required')).toBeVisible()
    await expect(page.getByText('State is required')).toBeVisible()
    await expect(page.getByText('Pincode is required')).toBeVisible()
    await screenshot(page, 'E2E-028', 3, 'all-errors-visible')

    // Should still be on checkout page
    await expect(page.getByText('Delivery Details')).toBeVisible()
  })

  test('E2E-029: Wrong credentials rejected', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Staff Login')).toBeVisible()
    await screenshot(page, 'E2E-029', 1, 'login-page')

    // Try wrong username
    await page.getByPlaceholder('Enter username').fill('wronguser')
    await page.getByPlaceholder('Enter password').fill('wrongpass')
    await page.getByRole('button', { name: 'Login' }).click()
    await screenshot(page, 'E2E-029', 2, 'wrong-credentials-submitted')

    // Verify error message
    await expect(page.getByText(/invalid|credentials|failed|error/i)).toBeVisible({ timeout: 10000 })
    await screenshot(page, 'E2E-029', 3, 'error-message-shown')

    // Should still be on login page
    await expect(page.getByText('Staff Login')).toBeVisible()

    // Try empty fields
    await page.getByPlaceholder('Enter username').fill('')
    await page.getByPlaceholder('Enter password').fill('')
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.getByText(/required/i)).toBeVisible()
    await screenshot(page, 'E2E-029', 4, 'empty-fields-error')
  })
})
