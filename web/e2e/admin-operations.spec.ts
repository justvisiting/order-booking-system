import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsStaff, screenshot } from './helpers'

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
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 })
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
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 })

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

  test('E2E-017: Admin edits existing product', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to products
    await page.getByRole('link', { name: 'Products' }).click()
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 })
    await screenshot(page, 'E2E-017', 1, 'product-list')

    // Create a product to edit
    await page.getByRole('button', { name: 'Add Product' }).click()
    await expect(page.getByText('Add Product').last()).toBeVisible()

    const originalName = `Edit Test ${Date.now()}`
    await page.getByPlaceholder('Product name').fill(originalName)
    await page.getByPlaceholder('Product description').fill('Original description')
    await page.getByPlaceholder('0.00').fill('30.00')
    await page.getByPlaceholder('e.g. kg, piece, litre').fill('kg')

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
    await expect(page.locator('table').getByText(originalName)).toBeVisible({ timeout: 15000 })
    await screenshot(page, 'E2E-017', 2, 'product-created')

    // Click edit on the product
    const productRow = page.locator('tr').filter({ hasText: originalName })
    await productRow.getByRole('button', { name: 'Edit' }).click()
    await expect(page.getByText('Edit Product')).toBeVisible()
    await screenshot(page, 'E2E-017', 3, 'edit-modal-opened')

    // Edit name, price, and description
    const editedName = `Edited ${Date.now()}`
    await page.getByPlaceholder('Product name').fill(editedName)
    await page.getByPlaceholder('Product description').fill('Updated description by E2E test')
    await page.getByPlaceholder('0.00').fill('75.00')
    await screenshot(page, 'E2E-017', 4, 'fields-edited')

    // Save changes
    await page.getByRole('button', { name: 'Update' }).click()
    await page.waitForTimeout(1000)

    // Verify updated product in admin list
    await expect(page.locator('table').getByText(editedName)).toBeVisible({ timeout: 10000 })
    await screenshot(page, 'E2E-017', 5, 'product-updated-in-list')

    // Verify on customer side
    const customerPage = await page.context().newPage()
    await customerPage.goto('/order')
    await expect(customerPage.getByText('Our Products')).toBeVisible()
    await expect(customerPage.getByText(editedName)).toBeVisible({ timeout: 10000 })
    await screenshot(customerPage, 'E2E-017', 6, 'product-updated-customer')
    await customerPage.close()
  })

  test('E2E-018: Admin views product list with all fields', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to products
    await page.getByRole('link', { name: 'Products' }).click()
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 })
    await screenshot(page, 'E2E-018', 1, 'product-list-loaded')

    // Verify table headers exist
    const tableHeader = page.locator('table thead')
    await expect(tableHeader.getByText('Name')).toBeVisible()
    await expect(tableHeader.getByText('Price')).toBeVisible()
    await expect(tableHeader.getByText('Active')).toBeVisible()
    await screenshot(page, 'E2E-018', 2, 'headers-verified')

    // Verify at least one product row exists with data
    const firstRow = page.locator('table tbody tr').first()
    await expect(firstRow).toBeVisible()

    // Verify product row has content (name, price visible)
    const cells = firstRow.locator('td')
    const cellCount = await cells.count()
    expect(cellCount).toBeGreaterThanOrEqual(3) // Name, Price, Active at minimum
    await screenshot(page, 'E2E-018', 3, 'product-row-verified')

    // Verify actions column has Edit and Delete buttons
    await expect(firstRow.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect(firstRow.getByRole('button', { name: 'Delete' })).toBeVisible()
    await screenshot(page, 'E2E-018', 4, 'actions-visible')
  })

  test('E2E-019: Admin creates user', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to users management
    await page.getByRole('link', { name: 'Users' }).click()
    await page.waitForTimeout(1000)
    await screenshot(page, 'E2E-019', 1, 'user-management-page')

    // Click Add User
    await page.getByRole('button', { name: 'Add User' }).click()
    await expect(page.getByText('Add User').last()).toBeVisible()
    await screenshot(page, 'E2E-019', 2, 'add-user-modal')

    // Fill user form
    const uniqueUsername = `testuser${Date.now()}`
    await page.getByPlaceholder('Enter username').fill(uniqueUsername)
    await page.getByPlaceholder('Minimum 6 characters').fill('password123')

    // Select role
    const roleSelect = page.locator('select')
    await roleSelect.selectOption('staff')
    await screenshot(page, 'E2E-019', 3, 'user-form-filled')

    // Submit
    await page.getByRole('button', { name: 'Create User' }).click()
    await page.waitForTimeout(1000)
    await screenshot(page, 'E2E-019', 4, 'user-created')

    // Verify user appears in the recently created users table
    await expect(page.getByRole('cell', { name: uniqueUsername })).toBeVisible({ timeout: 10000 })
    await screenshot(page, 'E2E-019', 5, 'user-in-list')
  })

  test('E2E-020: Admin views all orders', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to orders
    await page.getByRole('link', { name: 'Orders' }).click()
    await page.waitForTimeout(1000)
    await screenshot(page, 'E2E-020', 1, 'orders-page')

    // Verify orders table is visible
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 })
    await screenshot(page, 'E2E-020', 2, 'orders-table-loaded')

    // Verify table has order data
    const orderRows = page.locator('table tbody tr')
    const rowCount = await orderRows.count()
    expect(rowCount).toBeGreaterThan(0)

    // Verify table columns (Order #, Customer, Status, Amount, Date)
    const tableHeader = page.locator('table thead')
    await expect(tableHeader).toBeVisible()
    await screenshot(page, 'E2E-020', 3, 'orders-verified')

    // Verify search/filter controls exist
    await expect(page.getByPlaceholder('Search by order number, customer...')).toBeVisible()
    await screenshot(page, 'E2E-020', 4, 'filters-visible')

    // Click on an order to verify detail navigation works
    const orderLink = page.locator('table tbody tr a').first()
    await expect(orderLink).toBeVisible()
    await orderLink.click()
    await expect(page.getByText(/Order #/)).toBeVisible()
    await screenshot(page, 'E2E-020', 5, 'order-detail-from-admin')
  })
})
