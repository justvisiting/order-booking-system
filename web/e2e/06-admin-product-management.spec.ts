import { test, expect } from '@playwright/test'
import { loginAsAdmin, screenshotStep } from './helpers'

test.describe('TC-06: Admin Product Management', () => {
  test('TC-06.1: View product list in admin', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/products')
    await expect(page.getByText('Products')).toBeVisible()
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 })
    await screenshotStep(page, '06-01-admin-product-list')
  })

  test('TC-06.2: Create a new product', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/products')
    await page.locator('table').waitFor({ timeout: 5000 })

    await page.getByRole('button', { name: 'Add Product' }).click()
    await expect(page.getByText('Add Product')).toBeVisible()
    await screenshotStep(page, '06-02-step1-add-product-modal')

    await page.getByPlaceholder('Product name').fill('E2E Test Product')
    await page.getByPlaceholder('Product description').fill('Created by E2E test')
    await page.getByPlaceholder('0.00').fill('99.50')
    await page.getByPlaceholder('e.g. kg, piece, litre').fill('piece')
    await screenshotStep(page, '06-02-step2-form-filled')

    await page.getByRole('button', { name: 'Create' }).click()
    await page.waitForTimeout(1000)
    await screenshotStep(page, '06-02-step3-product-created')

    // Verify product appears in table
    await expect(page.getByText('E2E Test Product')).toBeVisible({ timeout: 5000 })
  })

  test('TC-06.3: Edit a product', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/products')
    await page.locator('table').waitFor({ timeout: 5000 })

    // Click Edit on first product
    await page.locator('button:has-text("Edit")').first().click()
    await expect(page.getByText('Edit Product')).toBeVisible()
    await screenshotStep(page, '06-03-edit-product-modal')

    // Change name
    const nameInput = page.getByPlaceholder('Product name')
    await nameInput.clear()
    await nameInput.fill('Updated Product Name')
    await page.getByRole('button', { name: 'Update' }).click()
    await page.waitForTimeout(1000)
    await screenshotStep(page, '06-03-product-updated')
  })
})
