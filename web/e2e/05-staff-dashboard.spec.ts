import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsStaff, fillOrderForm, screenshotStep, testCustomer } from './helpers'

test.describe('TC-05: Staff Dashboard', () => {
  test('TC-05.1: Staff login and view order list', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Staff Login')).toBeVisible()
    await screenshotStep(page, '05-01-step1-login-page')

    await loginAsStaff(page)
    await screenshotStep(page, '05-01-step2-dashboard-loaded')

    // Should see order list
    await expect(page.getByText('Orders')).toBeVisible()
  })

  test('TC-05.2: Admin login and view order list', async ({ page }) => {
    await loginAsAdmin(page)
    await screenshotStep(page, '05-02-admin-dashboard')
  })

  test('TC-05.3: View order detail and update status', async ({ page }) => {
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

    // Now login as staff and find the order
    await loginAsAdmin(page)
    await screenshotStep(page, '05-03-step1-order-list')

    // Click on first order
    const firstOrderLink = page.locator('table a').first()
    await firstOrderLink.click()
    await expect(page.getByText('Customer Details')).toBeVisible({ timeout: 5000 })
    await screenshotStep(page, '05-03-step2-order-detail')

    // Update status: Pending → Confirmed
    await page.getByRole('button', { name: 'Mark as Confirmed' }).click()
    await page.waitForTimeout(1000)
    await screenshotStep(page, '05-03-step3-status-confirmed')

    // Update status: Confirmed → Dispatched
    await page.getByRole('button', { name: 'Mark as Dispatched' }).click()
    await page.waitForTimeout(1000)
    await screenshotStep(page, '05-03-step4-status-dispatched')

    // Update status: Dispatched → Delivered
    await page.getByRole('button', { name: 'Mark as Delivered' }).click()
    await page.waitForTimeout(1000)
    await screenshotStep(page, '05-03-step5-status-delivered')
  })

  test('TC-05.4: Filter orders by status', async ({ page }) => {
    await loginAsAdmin(page)

    // Use status filter dropdown
    const statusSelect = page.locator('select')
    await statusSelect.selectOption('pending')
    await page.waitForTimeout(500)
    await screenshotStep(page, '05-04-filter-pending')
  })

  test('TC-05.5: Search orders by customer name', async ({ page }) => {
    await loginAsAdmin(page)

    await page.getByPlaceholder('Search by order number, customer...').fill(testCustomer.name)
    await page.waitForTimeout(500)
    await screenshotStep(page, '05-05-search-customer')
  })

  test('TC-05.6: Invalid login shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Enter username').fill('wronguser')
    await page.getByPlaceholder('Enter password').fill('wrongpass')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.locator('text=Invalid credentials').or(page.locator('.text-red-600'))).toBeVisible({ timeout: 5000 })
    await screenshotStep(page, '05-06-invalid-login')
  })
})
