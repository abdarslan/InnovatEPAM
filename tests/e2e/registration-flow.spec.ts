import { test, expect } from '@playwright/test'

test.describe('US1 — Employee Registration Flow', () => {
  test('successful registration creates account and redirects to dashboard', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()

    const uniqueEmail = `test${Date.now()}@epam.com`
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/display name/i).fill('Test User')
    await page.getByLabel(/^password/i).fill('Password1')
    await page.getByRole('button', { name: /register/i }).click()

    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('banner').getByText('Test User', { exact: true })).toBeVisible()
  })

  test('shows error for non-EPAM domain', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel(/email/i).fill('user@gmail.com')
    await page.getByLabel(/display name/i).fill('Test User')
    await page.getByLabel(/^password/i).fill('Password1')
    await page.getByRole('button', { name: /register/i }).click()

    await expect(page.getByText(/only @epam\.com/i)).toBeVisible()
  })

  test('shows error for weak password', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel(/email/i).fill('user@epam.com')
    await page.getByLabel(/display name/i).fill('Test User')
    await page.getByLabel(/^password/i).fill('weak')
    await page.getByRole('button', { name: /register/i }).click()

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible()
  })
})
