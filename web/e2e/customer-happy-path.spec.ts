import { test, expect } from '@playwright/test'
import {
  addProductToCart,
  openCart,
  fillOrderForm,
  screenshot,
  testCustomer,
  testAddress,
} from './helpers'

test.describe('Customer Happy Path', () => {
  test.describe.configure({ mode: 'serial' })

  test('E2E-001: Browse products, see categories, filter by category', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()
    await screenshot(page, 'E2E-001', 1, 'catalog-loaded')

    // Verify products are displayed
    const productCards = page.locator('.bg-white.rounded-xl.shadow-sm')
    await expect(productCards.first()).toBeVisible()
    const productCount = await productCards.count()
    expect(productCount).toBeGreaterThan(0)

    // Verify category filter buttons exist
    const allButton = page.getByRole('button', { name: 'All' })
    await expect(allButton).toBeVisible()
    await screenshot(page, 'E2E-001', 2, 'categories-visible')

    // Click a category filter (pick the second button after "All")
    const categoryButtons = page.locator('.flex.gap-2.flex-wrap button')
    const categoryCount = await categoryButtons.count()
    expect(categoryCount).toBeGreaterThan(1) // At least "All" + one category

    // Click the second category button (first actual category)
    await categoryButtons.nth(1).click()
    await page.waitForTimeout(300)
    await screenshot(page, 'E2E-001', 3, 'filtered-by-category')

    // Verify filter is applied - the clicked button should be active (blue)
    await expect(categoryButtons.nth(1)).toHaveAttribute('aria-pressed', 'true')

    // Click "All" to reset
    await allButton.click()
    await page.waitForTimeout(300)
    const resetCount = await productCards.count()
    expect(resetCount).toBe(productCount)
    await screenshot(page, 'E2E-001', 4, 'filter-reset')
  })

  test('E2E-002: Search products by name', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Get a product name to search for
    const firstProductName = await page
      .locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
      .first()
      .textContent()
    expect(firstProductName).toBeTruthy()

    // Search for the product
    const searchInput = page.getByPlaceholder('Search products...')
    await searchInput.fill(firstProductName!.substring(0, 4))
    await page.waitForTimeout(300)
    await screenshot(page, 'E2E-002', 1, 'search-entered')

    // Verify filtered results contain the product
    const results = page.locator('.bg-white.rounded-xl.shadow-sm')
    await expect(results.first()).toBeVisible()
    const resultCount = await results.count()
    expect(resultCount).toBeGreaterThan(0)

    // Search for something that doesn't exist
    await searchInput.fill('xyznonexistent999')
    await page.waitForTimeout(300)
    await expect(page.getByText('No products found')).toBeVisible()
    await screenshot(page, 'E2E-002', 2, 'no-results')

    // Clear search
    await searchInput.fill('')
    await page.waitForTimeout(300)
    await expect(results.first()).toBeVisible()
    await screenshot(page, 'E2E-002', 3, 'search-cleared')
  })

  test('E2E-003: Add to cart, adjust quantities', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Get first product name
    const productName = await page
      .locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
      .first()
      .textContent()

    // Add product to cart
    await addProductToCart(page, productName!)
    await screenshot(page, 'E2E-003', 1, 'product-added')

    // Open cart
    await openCart(page)
    await screenshot(page, 'E2E-003', 2, 'cart-opened')

    // Verify item is in cart (use heading to avoid strict mode)
    await expect(page.locator('h4').filter({ hasText: productName! })).toBeVisible()

    // Increase quantity
    const plusButton = page.locator('button:has-text("+")').first()
    await plusButton.click()
    await page.waitForTimeout(300)
    await screenshot(page, 'E2E-003', 3, 'quantity-increased')

    // Decrease quantity
    const minusButton = page.locator('button:has-text("−"), button:has-text("-")').first()
    await minusButton.click()
    await page.waitForTimeout(300)
    await screenshot(page, 'E2E-003', 4, 'quantity-decreased')
  })

  test('E2E-004: Fill order form with valid delivery info', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Add a product and proceed to checkout
    const productName = await page
      .locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
      .first()
      .textContent()
    await addProductToCart(page, productName!)

    await openCart(page)
    await page.getByRole('button', { name: /Checkout/i }).click()
    await expect(page.getByText('Delivery Details')).toBeVisible()
    await screenshot(page, 'E2E-004', 1, 'checkout-form')

    // Fill form
    await fillOrderForm(page)
    await screenshot(page, 'E2E-004', 2, 'form-filled')

    // Verify all fields are filled
    await expect(page.getByPlaceholder('Enter your name')).toHaveValue(testCustomer.name)
    await expect(page.getByPlaceholder('10-digit phone number')).toHaveValue(testCustomer.phone)
    await expect(page.getByPlaceholder('House/Flat number, Street, Area')).toHaveValue(testAddress.address)
    await expect(page.getByPlaceholder('City')).toHaveValue(testAddress.city)
    await expect(page.getByPlaceholder('State')).toHaveValue(testAddress.state)
    await expect(page.getByPlaceholder('6-digit pincode')).toHaveValue(testAddress.pincode)
  })

  test('E2E-005: Review and submit order', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Add product
    const productName = await page
      .locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
      .first()
      .textContent()
    await addProductToCart(page, productName!)

    // Checkout
    await openCart(page)
    await page.getByRole('button', { name: /Checkout/i }).click()
    await expect(page.getByText('Delivery Details')).toBeVisible()

    // Fill form and submit
    await fillOrderForm(page)
    await page.getByRole('button', { name: 'Review Order' }).click()

    // Review page
    await expect(page.getByText('Review Your Order')).toBeVisible()
    await screenshot(page, 'E2E-005', 1, 'review-page')

    // Verify customer info on review page
    await expect(page.getByText(testCustomer.name)).toBeVisible()
    await expect(page.getByText(testCustomer.phone)).toBeVisible()
    await expect(page.getByText(testAddress.address)).toBeVisible()
    // Use .first() to avoid strict mode when product name appears in both review and cart sidebar
    await expect(page.getByText(productName!).first()).toBeVisible()

    // Verify total is shown
    await expect(page.getByText('Total').first()).toBeVisible()
    await screenshot(page, 'E2E-005', 2, 'review-verified')

    // Submit order
    await page.getByRole('button', { name: 'Place Order' }).click()

    // Wait for confirmation
    await expect(page.getByText('Order Placed Successfully!')).toBeVisible({ timeout: 15000 })
    await screenshot(page, 'E2E-005', 3, 'order-placed')
  })

  test('E2E-006: See confirmation with order number', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Full flow: add → checkout → fill → review → place
    const productName = await page
      .locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
      .first()
      .textContent()
    await addProductToCart(page, productName!)
    await openCart(page)
    await page.getByRole('button', { name: /Checkout/i }).click()
    await expect(page.getByText('Delivery Details')).toBeVisible()
    await fillOrderForm(page)
    await page.getByRole('button', { name: 'Review Order' }).click()
    await expect(page.getByText('Review Your Order')).toBeVisible()
    await page.getByRole('button', { name: 'Place Order' }).click()

    // Confirmation page
    await expect(page.getByText('Order Placed Successfully!')).toBeVisible({ timeout: 15000 })
    await screenshot(page, 'E2E-006', 1, 'confirmation-page')

    // Verify order number is displayed
    await expect(page.getByText('Order Number')).toBeVisible()
    const orderNumber = await page.locator('.text-2xl.font-bold.text-neutral-900').last().textContent()
    expect(orderNumber).toBeTruthy()
    expect(orderNumber!.length).toBeGreaterThan(0)
    await screenshot(page, 'E2E-006', 2, 'order-number-visible')

    // Verify navigation links
    await expect(page.getByRole('button', { name: 'Track Order' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue Shopping' })).toBeVisible()
    await screenshot(page, 'E2E-006', 3, 'confirmation-complete')
  })

  test('E2E-007: Track order by phone number', async ({ page }) => {
    // First place an order so we have something to track
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    const productName = await page
      .locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
      .first()
      .textContent()
    await addProductToCart(page, productName!)
    await openCart(page)
    await page.getByRole('button', { name: /Checkout/i }).click()
    await expect(page.getByText('Delivery Details')).toBeVisible()
    await fillOrderForm(page)
    await page.getByRole('button', { name: 'Review Order' }).click()
    await expect(page.getByText('Review Your Order')).toBeVisible()
    await page.getByRole('button', { name: 'Place Order' }).click()
    await expect(page.getByText('Order Placed Successfully!')).toBeVisible({ timeout: 15000 })
    await screenshot(page, 'E2E-007', 1, 'order-placed')

    // Navigate to order tracking page
    await page.getByRole('button', { name: 'Track Order' }).click()
    await page.waitForTimeout(500)
    await screenshot(page, 'E2E-007', 2, 'track-page-loaded')

    // Enter phone number to look up orders
    const phoneInput = page.getByPlaceholder('Enter your 10-digit phone number')
    await expect(phoneInput).toBeVisible()
    await phoneInput.fill(testCustomer.phone)
    await page.getByRole('button', { name: 'Search' }).click()
    await page.waitForTimeout(2000)
    await screenshot(page, 'E2E-007', 3, 'order-results')

    // Verify order results are displayed
    await expect(page.getByText(/Order #/).first()).toBeVisible({ timeout: 10000 })

    // Verify status is shown (should be "pending" for a freshly placed order)
    await expect(page.getByText(/pending/i).first()).toBeVisible()
    await screenshot(page, 'E2E-007', 4, 'order-status-visible')
  })
})
