import { test, expect } from '@playwright/test'
import { loginAsAdmin, screenshot } from './helpers'

test.describe('Admin Operations', () => {
  test.describe.configure({ mode: 'serial' })

  test('E2E-015: Admin login', async ({ page }) => {
    await page.goto('/login')
    await screenshot(page, 'E2E-015', 1, 'login-page')

    await page.getByPlaceholder('Enter username').fill('admin')
    await page.getByPlaceholder('Enter password').fill('admin123')
    await screenshot(page, 'E2E-015', 2, 'credentials-entered')

    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible({ timeout: 10000 })
    await screenshot(page, 'E2E-015', 3, 'admin-dashboard')

    // Admin should see admin-only links (Products, Categories, Users)
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible()
    await screenshot(page, 'E2E-015', 4, 'admin-nav-verified')
  })

  test('E2E-016: Admin creates new product', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to products
    await page.getByRole('link', { name: 'Products' }).click()
    await expect(page.getByText('Products')).toBeVisible()
    await screenshot(page, 'E2E-016', 1, 'product-list')

    // Click Add Product
    await page.getByRole('button', { name: 'Add Product' }).click()
    await expect(page.getByText('Add Product').last()).toBeVisible()
    await screenshot(page, 'E2E-016', 2, 'add-product-modal')

    // Fill product form
    const uniqueName = `Test Product ${Date.now()}`
    await page.getByPlaceholder('Product name').fill(uniqueName)
    await page.getByPlaceholder('Product description').fill('A test product created by E2E tests')
    await page.getByPlaceholder('0.00').fill('99.50')
    await page.getByPlaceholder('e.g. kg, piece, litre').fill('piece')

    // Select category if available
    const categorySelect = page.locator('select')
    if (await categorySelect.isVisible()) {
      const options = await categorySelect.locator('option').allTextContents()
      if (options.length > 1) {
        await categorySelect.selectOption({ index: 1 })
      }
    }

    // Ensure Active checkbox is checked
    const activeCheckbox = page.locator('input[type="checkbox"]')
    if (!(await activeCheckbox.isChecked())) {
      await activeCheckbox.check()
    }
    await screenshot(page, 'E2E-016', 3, 'product-form-filled')

    // Submit
    await page.getByRole('button', { name: 'Create' }).click()

    // Verify product appears in list
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10000 })
    await screenshot(page, 'E2E-016', 4, 'product-created')
  })

  test('E2E-034: Admin deactivates product → customer cannot see it', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to products
    await page.getByRole('link', { name: 'Products' }).click()
    await expect(page.getByText('Products')).toBeVisible()

    // Create a product to deactivate
    await page.getByRole('button', { name: 'Add Product' }).click()
    await expect(page.getByText('Add Product').last()).toBeVisible()

    const deactivateName = `Deactivate Test ${Date.now()}`
    await page.getByPlaceholder('Product name').fill(deactivateName)
    await page.getByPlaceholder('Product description').fill('Product to be deactivated')
    await page.getByPlaceholder('0.00').fill('50.00')
    await page.getByPlaceholder('e.g. kg, piece, litre').fill('piece')

    // Select a category (required for successful creation)
    const categorySelect = page.locator('select')
    if (await categorySelect.isVisible()) {
      const options = await categorySelect.locator('option').allTextContents()
      if (options.length > 1) {
        await categorySelect.selectOption({ index: 1 })
      }
    }

    const activeCheckbox = page.locator('input[type="checkbox"]')
    if (!(await activeCheckbox.isChecked())) {
      await activeCheckbox.check()
    }

    await page.getByRole('button', { name: 'Create' }).click()
    // Wait for modal to close and table to refresh
    await expect(page.locator('table').getByText(deactivateName)).toBeVisible({ timeout: 15000 })
    await screenshot(page, 'E2E-034', 1, 'product-created-active')

    // Verify the product is visible on customer side
    const customerPage = await page.context().newPage()
    await customerPage.goto('/order')
    await expect(customerPage.getByText('Our Products')).toBeVisible()
    await expect(customerPage.getByText(deactivateName)).toBeVisible({ timeout: 10000 })
    await screenshot(customerPage, 'E2E-034', 2, 'product-visible-customer')

    // Go back to admin and deactivate (edit the product, uncheck Active)
    const productRow = page.locator('tr').filter({ hasText: deactivateName })
    await productRow.getByText('Edit').click()
    await expect(page.getByText('Edit Product')).toBeVisible()

    // Uncheck Active
    const editCheckbox = page.locator('input[type="checkbox"]')
    await editCheckbox.uncheck()
    await screenshot(page, 'E2E-034', 3, 'product-deactivated-form')

    await page.getByRole('button', { name: 'Update' }).click()
    await page.waitForTimeout(1000)
    await screenshot(page, 'E2E-034', 4, 'product-deactivated-admin')

    // Verify the product is NOT visible on customer side
    await customerPage.reload()
    await expect(customerPage.getByText('Our Products')).toBeVisible()
    await customerPage.waitForTimeout(1000)
    await expect(customerPage.getByText(deactivateName)).not.toBeVisible()
    await screenshot(customerPage, 'E2E-034', 5, 'product-hidden-customer')

    await customerPage.close()
  })
})
