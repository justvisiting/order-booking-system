import { test, expect } from '@playwright/test'
import {
  loginAsStaff,
  addProductToCart,
  openCart,
  fillOrderForm,
  screenshot,
  testCustomer,
  testAddress,
} from './helpers'

test.describe('Staff Operations', () => {
  test.describe.configure({ mode: 'serial' })

  test('E2E-008: Staff login', async ({ page }) => {
    await page.goto('/login')
    await screenshot(page, 'E2E-008', 1, 'login-page')

    await page.getByPlaceholder('Enter username').fill('staff')
    await page.getByPlaceholder('Enter password').fill('admin123')
    await screenshot(page, 'E2E-008', 2, 'credentials-entered')

    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible({ timeout: 10000 })
    await screenshot(page, 'E2E-008', 3, 'staff-dashboard')

    // Staff should see Orders link in nav
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible()
    await screenshot(page, 'E2E-008', 4, 'staff-dashboard-verified')
  })

  test('E2E-010: Staff views order details', async ({ page }) => {
    // First create an order as a customer
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

    // Now login as staff
    await loginAsStaff(page)
    await screenshot(page, 'E2E-010', 1, 'staff-order-list')

    // Click on the first order link
    const orderLink = page.locator('table tbody tr a').first()
    await expect(orderLink).toBeVisible()
    await orderLink.click()

    // Verify order detail page
    await expect(page.getByText(/Order #/)).toBeVisible()
    await screenshot(page, 'E2E-010', 2, 'order-detail')

    // Verify customer details are shown
    await expect(page.getByText('Customer Details')).toBeVisible()
    await expect(page.getByText('Order Items')).toBeVisible()
    await expect(page.getByText('Total')).toBeVisible()
    await screenshot(page, 'E2E-010', 3, 'order-detail-verified')
  })

  test('E2E-011: Staff updates order lifecycle (pending→confirmed→dispatched→delivered)', async ({
    page,
  }) => {
    // Create a fresh order
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

    // Get the order number
    const orderNumber = await page.locator('.text-2xl.font-bold.text-neutral-900').last().textContent()

    // Login as staff
    await loginAsStaff(page)

    // Search for the order
    if (orderNumber) {
      await page.getByPlaceholder('Search by order number, customer...').fill(orderNumber)
      await page.waitForTimeout(500)
    }

    // Click the first order
    const orderLink = page.locator('table tbody tr a').first()
    await expect(orderLink).toBeVisible()
    await orderLink.click()
    await expect(page.getByText(/Order #/)).toBeVisible()
    await screenshot(page, 'E2E-011', 1, 'order-pending')

    // Update: pending → confirmed
    await page.getByRole('button', { name: /Mark as Confirmed/i }).click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('confirmed').first()).toBeVisible()
    await screenshot(page, 'E2E-011', 2, 'order-confirmed')

    // Update: confirmed → dispatched
    await page.getByRole('button', { name: /Mark as Dispatched/i }).click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('dispatched').first()).toBeVisible()
    await screenshot(page, 'E2E-011', 3, 'order-dispatched')

    // Update: dispatched → delivered
    await page.getByRole('button', { name: /Mark as Delivered/i }).click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('delivered').first()).toBeVisible()
    await screenshot(page, 'E2E-011', 4, 'order-delivered')

    // Verify no more status transitions available
    await expect(page.getByRole('button', { name: /Mark as/ })).not.toBeVisible()
    await screenshot(page, 'E2E-011', 5, 'lifecycle-complete')
  })

  test('E2E-009: Staff filters and searches orders', async ({ page }) => {
    // First create an order so there's data to filter
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

    // Get the order number for searching
    const orderNumber = await page.locator('.text-2xl.font-bold.text-neutral-900').last().textContent()

    // Login as staff
    await loginAsStaff(page)
    await screenshot(page, 'E2E-009', 1, 'staff-dashboard')

    // Test search by order number
    const searchInput = page.getByPlaceholder('Search by order number, customer...')
    await expect(searchInput).toBeVisible()
    if (orderNumber) {
      await searchInput.fill(orderNumber)
      await page.waitForTimeout(500)
      await screenshot(page, 'E2E-009', 2, 'search-by-order-number')

      // Verify the searched order appears in results
      await expect(page.locator('table tbody tr').first()).toBeVisible()
      await expect(page.locator('table').first().getByText(orderNumber)).toBeVisible()
    }

    // Clear search
    await searchInput.fill('')
    await page.waitForTimeout(500)

    // Test search by customer name
    await searchInput.fill(testCustomer.name)
    await page.waitForTimeout(500)
    await screenshot(page, 'E2E-009', 3, 'search-by-customer-name')
    await expect(page.locator('table tbody tr').first()).toBeVisible()

    // Clear search
    await searchInput.fill('')
    await page.waitForTimeout(500)

    // Test filter by status
    const statusFilter = page.locator('select[aria-label="Filter by status"]')
    await expect(statusFilter).toBeVisible()
    await statusFilter.selectOption('pending')
    await page.waitForTimeout(500)
    await screenshot(page, 'E2E-009', 4, 'filtered-by-pending')

    // Verify all visible orders have pending status
    const rows = page.locator('table tbody tr')
    const rowCount = await rows.count()
    if (rowCount > 0) {
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        await expect(rows.nth(i).getByText(/pending/i)).toBeVisible()
      }
    }

    // Reset filter to All
    await statusFilter.selectOption('')
    await page.waitForTimeout(500)
    await screenshot(page, 'E2E-009', 5, 'filter-reset')
  })

  test('E2E-012: Staff views order with multiple items', async ({ page }) => {
    // Create an order with multiple products
    await page.goto('/order')
    await expect(page.getByText('Our Products')).toBeVisible()

    // Get first two product names
    const productNames = page.locator('.bg-white.rounded-xl .font-semibold.text-neutral-900')
    const product1 = await productNames.nth(0).textContent()
    const product2 = await productNames.nth(1).textContent()
    expect(product1).toBeTruthy()
    expect(product2).toBeTruthy()

    // Add both products to cart
    await addProductToCart(page, product1!)
    await addProductToCart(page, product2!)

    // Checkout
    await openCart(page)
    await page.getByRole('button', { name: /Checkout/i }).click()
    await expect(page.getByText('Delivery Details')).toBeVisible()
    await fillOrderForm(page)
    await page.getByRole('button', { name: 'Review Order' }).click()
    await expect(page.getByText('Review Your Order')).toBeVisible()
    await page.getByRole('button', { name: 'Place Order' }).click()
    await expect(page.getByText('Order Placed Successfully!')).toBeVisible({ timeout: 15000 })

    const orderNumber = await page.locator('.text-2xl.font-bold.text-neutral-900').last().textContent()

    // Login as staff and find the order
    await loginAsStaff(page)

    if (orderNumber) {
      await page.getByPlaceholder('Search by order number, customer...').fill(orderNumber)
      await page.waitForTimeout(500)
    }

    const orderLink = page.locator('table tbody tr a').first()
    await expect(orderLink).toBeVisible()
    await orderLink.click()
    await expect(page.getByText(/Order #/)).toBeVisible()
    await screenshot(page, 'E2E-012', 1, 'order-detail-multi-items')

    // Verify both products are listed in order items
    await expect(page.getByText('Order Items')).toBeVisible()
    await expect(page.getByText(product1!).first()).toBeVisible()
    await expect(page.getByText(product2!).first()).toBeVisible()
    await screenshot(page, 'E2E-012', 2, 'both-items-visible')

    // Verify total is displayed
    await expect(page.getByText('Total').first()).toBeVisible()
    await screenshot(page, 'E2E-012', 3, 'total-verified')
  })

  test('E2E-013: Staff sees customer delivery info', async ({ page }) => {
    // Create an order with specific delivery info
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

    const orderNumber = await page.locator('.text-2xl.font-bold.text-neutral-900').last().textContent()

    // Login as staff and view the order
    await loginAsStaff(page)

    if (orderNumber) {
      await page.getByPlaceholder('Search by order number, customer...').fill(orderNumber)
      await page.waitForTimeout(500)
    }

    const orderLink = page.locator('table tbody tr a').first()
    await expect(orderLink).toBeVisible()
    await orderLink.click()
    await expect(page.getByText(/Order #/)).toBeVisible()
    await screenshot(page, 'E2E-013', 1, 'order-detail-page')

    // Verify customer details section
    await expect(page.getByText('Customer Details')).toBeVisible()
    await expect(page.getByText(testCustomer.name)).toBeVisible()
    await screenshot(page, 'E2E-013', 2, 'customer-details-visible')

    // Verify delivery address section
    await expect(page.getByText(testAddress.address)).toBeVisible()
    await expect(page.getByText(testAddress.city)).toBeVisible()
    await expect(page.getByText(testAddress.state)).toBeVisible()
    await expect(page.getByText(testAddress.pincode)).toBeVisible()
    await screenshot(page, 'E2E-013', 3, 'delivery-info-verified')
  })
})
