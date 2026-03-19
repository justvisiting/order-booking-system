import { test, expect } from '@playwright/test'
import { addProductToCart, openCart, screenshot } from './helpers'

test.describe('Edge Cases & Error Handling', () => {
  test('E2E-021: Empty cart submission blocked', async ({ page }) => {
    // First load the app at catalog to initialize React
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()
    await screenshot(page, 'E2E-021', 1, 'catalog-loaded-first')

    // Now try to navigate to checkout with empty cart via the URL bar
    await page.goto('/order/checkout')
    await page.waitForTimeout(3000)
    await screenshot(page, 'E2E-021', 2, 'after-checkout-redirect')

    // The OrderForm redirects to /order when cart is empty
    // Verify we are NOT on the checkout page (no Delivery Details form visible)
    await expect(page.getByText('Delivery Details')).not.toBeVisible()

    // The user should NOT be able to submit an order with an empty cart
    // Verify the checkout form is not accessible
    await expect(page.getByRole('button', { name: 'Review Order' })).not.toBeVisible()
    await screenshot(page, 'E2E-021', 3, 'checkout-blocked')
  })

  test('E2E-022: Invalid phone rejected', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Add a product to cart
    const productName = await page
      .locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
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
      .locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
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

  test('E2E-023: Add same product twice increases quantity', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Get the first product name
    const productName = await page
      .locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
      .first()
      .textContent()
    expect(productName).toBeTruthy()

    // Add the same product 3 times
    await addProductToCart(page, productName!)
    await addProductToCart(page, productName!)
    await addProductToCart(page, productName!)
    await screenshot(page, 'E2E-023', 1, 'product-added-3-times')

    // Open cart
    await openCart(page)
    await screenshot(page, 'E2E-023', 2, 'cart-opened')

    // Verify the product appears once with quantity 3 (not three separate entries)
    const cartItems = page.locator('h4').filter({ hasText: productName! })
    await expect(cartItems).toHaveCount(1)

    // Verify quantity shows 3
    await expect(page.getByText('3').first()).toBeVisible()
    await screenshot(page, 'E2E-023', 3, 'quantity-is-3')
  })

  test('E2E-024: Remove item from cart', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Add two products
    const productNames = page.locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
    const product1 = await productNames.nth(0).textContent()
    const product2 = await productNames.nth(1).textContent()
    expect(product1).toBeTruthy()
    expect(product2).toBeTruthy()

    await addProductToCart(page, product1!)
    await addProductToCart(page, product2!)

    // Open cart
    await openCart(page)
    await screenshot(page, 'E2E-024', 1, 'cart-with-2-items')

    // Verify both items are in the cart
    await expect(page.locator('h4').filter({ hasText: product1! })).toBeVisible()
    await expect(page.locator('h4').filter({ hasText: product2! })).toBeVisible()

    // Remove first item by clicking minus until quantity is 0 (or remove button)
    const removeButtons = page.locator('button:has-text("Remove"), button[aria-label="Remove"]')
    if (await removeButtons.first().isVisible()) {
      await removeButtons.first().click()
      await page.waitForTimeout(300)
    } else {
      // Use minus button to decrease to 0
      const minusButton = page.locator('button:has-text("−"), button:has-text("-")').first()
      await minusButton.click()
      await page.waitForTimeout(300)
    }
    await screenshot(page, 'E2E-024', 2, 'item-removed')

    // Remove second item
    const removeButtons2 = page.locator('button:has-text("Remove"), button[aria-label="Remove"]')
    if (await removeButtons2.first().isVisible()) {
      await removeButtons2.first().click()
      await page.waitForTimeout(300)
    } else {
      const minusButton = page.locator('button:has-text("−"), button:has-text("-")').first()
      await minusButton.click()
      await page.waitForTimeout(300)
    }
    await page.waitForTimeout(500)
    await screenshot(page, 'E2E-024', 3, 'cart-empty')

    // Verify cart is empty
    await expect(page.getByText(/empty|no items/i)).toBeVisible()
    await screenshot(page, 'E2E-024', 4, 'empty-cart-verified')
  })

  test('E2E-025: Empty search returns all products', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Count all products initially
    const productCards = page.locator('.bg-white.rounded-xl.shadow-sm')
    await expect(productCards.first()).toBeVisible()
    const totalProducts = await productCards.count()
    expect(totalProducts).toBeGreaterThan(0)
    await screenshot(page, 'E2E-025', 1, 'all-products-initial')

    // Search with empty string (just click in search and leave empty)
    const searchInput = page.getByPlaceholder('Search products...')
    await searchInput.fill('')
    await page.waitForTimeout(300)
    await screenshot(page, 'E2E-025', 2, 'empty-search')

    // Verify all products are still shown
    const afterEmptySearch = await productCards.count()
    expect(afterEmptySearch).toBe(totalProducts)

    // Search for something, then clear
    await searchInput.fill('xyz')
    await page.waitForTimeout(300)
    await searchInput.fill('')
    await page.waitForTimeout(300)
    const afterClear = await productCards.count()
    expect(afterClear).toBe(totalProducts)
    await screenshot(page, 'E2E-025', 3, 'products-restored-after-clear')
  })

  test('E2E-026: Category filter + search combined', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Get total product count
    const productCards = page.locator('.bg-white.rounded-xl.shadow-sm')
    await expect(productCards.first()).toBeVisible()
    const totalProducts = await productCards.count()
    await screenshot(page, 'E2E-026', 1, 'all-products')

    // Click a category filter
    const categoryButtons = page.locator('.flex.gap-2.flex-wrap button')
    const categoryCount = await categoryButtons.count()
    expect(categoryCount).toBeGreaterThan(1)

    await categoryButtons.nth(1).click()
    await page.waitForTimeout(300)
    const filteredCount = await productCards.count()
    await screenshot(page, 'E2E-026', 2, 'category-filtered')

    // Now also search within the filtered category
    const searchInput = page.getByPlaceholder('Search products...')
    if (filteredCount > 0) {
      // Get a product name from the filtered results
      const firstFilteredProduct = await page
        .locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
        .first()
        .textContent()

      if (firstFilteredProduct) {
        await searchInput.fill(firstFilteredProduct.substring(0, 3))
        await page.waitForTimeout(300)
        await screenshot(page, 'E2E-026', 3, 'category-plus-search')

        // Results should be <= the category filtered count
        const combinedCount = await productCards.count()
        expect(combinedCount).toBeLessThanOrEqual(filteredCount)
        expect(combinedCount).toBeGreaterThan(0)
      }
    }

    // Clear search, verify category filter still active
    await searchInput.fill('')
    await page.waitForTimeout(300)
    const afterClearSearch = await productCards.count()
    expect(afterClearSearch).toBe(filteredCount)
    await screenshot(page, 'E2E-026', 4, 'search-cleared-filter-active')

    // Click All to reset everything
    await page.getByRole('button', { name: 'All' }).click()
    await page.waitForTimeout(300)
    const resetCount = await productCards.count()
    expect(resetCount).toBe(totalProducts)
    await screenshot(page, 'E2E-026', 5, 'all-filters-reset')
  })
})
