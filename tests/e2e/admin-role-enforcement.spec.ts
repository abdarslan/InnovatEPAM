import { test, expect } from '@playwright/test'

test.describe('US3 — Admin Access & Role Enforcement', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('submitter cannot access admin routes', async ({ page }) => {
    // Register as submitter
    await page.goto('/register')
    const email = `submitter${Date.now()}@epam.com`
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/display name/i).fill('Submitter User')
    await page.getByLabel(/^password/i).fill('Password1')
    await page.getByRole('button', { name: /register/i }).click()
    await expect(page).toHaveURL('/dashboard')

    // Try to access admin dashboard
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL('/access-denied')
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible()
    await expect(page.getByText(/do not have permission/i)).toBeVisible()
  })

  test('access-denied page shows correct title and message', async ({ page }) => {
    // Register as submitter first
    await page.goto('/register')
    const email = `submitter2${Date.now()}@epam.com`
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/display name/i).fill('Submitter2')
    await page.getByLabel(/^password/i).fill('Password1')
    await page.getByRole('button', { name: /register/i }).click()

    await page.goto('/access-denied')
    await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
    await expect(page.getByText('You do not have permission to access this page.')).toBeVisible()
    await expect(page.getByRole('link', { name: /back to dashboard/i })).toBeVisible()
  })
})
