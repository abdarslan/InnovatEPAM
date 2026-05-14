import { test, expect } from '@playwright/test'

test.describe('US2 — Employee Login Flow', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    // Requires a pre-existing user — seed via db:seed for ADMIN or register first
    await page.goto('/register')
    const email = `logintest${Date.now()}@epam.com`
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/display name/i).fill('Login Test User')
    await page.getByLabel(/^password/i).fill('Password1')
    await page.getByRole('button', { name: /register/i }).click()
    await expect(page).toHaveURL('/dashboard')

    // Logout
    await page.getByRole('button', { name: /logout/i }).click()
    await expect(page).toHaveURL(/\/login/)

    // Login again
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill('Password1')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('nobody@epam.com')
    await page.getByLabel(/password/i).fill('WrongPass1')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByRole('alert')).toContainText(/invalid email or password/i)
  })

  test('shows session-expired message when redirected with reason=session_expired', async ({ page }) => {
    await page.goto('/login?reason=session_expired')
    await expect(page.getByText(/session expired/i)).toBeVisible()
  })
})
