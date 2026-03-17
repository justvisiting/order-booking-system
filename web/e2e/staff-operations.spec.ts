import { test, expect } from '@playwright/test'
import {
  loginAsStaff,
  addProductToCart,
  openCart,
  fillOrderForm,
  screenshot,
  testCustomer,
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
      .locator('.bg-white.rounded-xl .font-semibold.text-gray-900')
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
      .locator('.bg-white.rounded-xl .font-semibold.text-gray-900')
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
    const orderNumber = await page.locator('.text-2xl.font-bold.text-gray-900').last().textContent()

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
})
