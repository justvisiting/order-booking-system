import { Page, expect } from '@playwright/test'

export const BASE_URL = 'http://localhost:3000'
export const API_URL = 'http://localhost:8090'

export const testCustomer = {
  name: 'Test Customer',
  phone: '9876543210',
}

export const testAddress = {
  address: '42 MG Road, Koramangala',
  city: 'Bangalore',
  state: 'Karnataka',
  pincode: '560034',
}

export const adminCredentials = {
  username: 'admin',
  password: 'admin123',
}

export const staffCredentials = {
  username: 'staff',
  password: 'admin123',
}

export async function addProductToCart(page: Page, productName: string) {
  const card = page.locator('.bg-white.rounded-xl').filter({ hasText: productName })
  await card.getByRole('button', { name: 'Add to Cart' }).click()
  // Wait for toast
  await page.waitForTimeout(500)
}

export async function openCart(page: Page) {
  // Click cart icon in header
  await page.locator('header button').last().click()
  await expect(page.getByText('Cart (')).toBeVisible()
}

export async function fillOrderForm(page: Page) {
  await page.getByPlaceholder('Enter your name').fill(testCustomer.name)
  await page.getByPlaceholder('10-digit phone number').fill(testCustomer.phone)
  await page.getByPlaceholder('House/Flat number, Street, Area').fill(testAddress.address)
  await page.getByPlaceholder('City').fill(testAddress.city)
  await page.getByPlaceholder('State').fill(testAddress.state)
  await page.getByPlaceholder('6-digit pincode').fill(testAddress.pincode)
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('Enter username').fill(adminCredentials.username)
  await page.getByPlaceholder('Enter password').fill(adminCredentials.password)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible({ timeout: 10000 })
}

export async function loginAsStaff(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('Enter username').fill(staffCredentials.username)
  await page.getByPlaceholder('Enter password').fill(staffCredentials.password)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible({ timeout: 10000 })
}

export async function screenshotStep(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true })
}
