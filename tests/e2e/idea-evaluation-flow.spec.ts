import { test, expect } from '@playwright/test'

/**
 * E2E tests for the Idea Evaluation Workflow (Feature 003)
 *
 * Prerequisites: The app is seeded with at least one admin account.
 * These tests register fresh users per run and create ideas via UI.
 */

test.describe('US1 — Admin Evaluates Ideas', () => {
  test('admin can navigate to Idea Management page', async ({ page }) => {
    // Register admin via seed — use the pre-existing admin from db:seed
    // For E2E we login with seeded admin credentials
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@epam.com')
    await page.getByLabel(/password/i).fill('Admin1234!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/admin/dashboard')

    await page.getByRole('link', { name: /idea management/i }).click()
    await expect(page).toHaveURL('/admin/ideas')
    await expect(page.getByRole('heading', { name: /idea management/i })).toBeVisible()
  })

  test('admin can start review and then accept an idea', async ({ page }) => {
    // 1. Register submitter and submit an idea
    const submitterEmail = `submitter${Date.now()}@epam.com`
    await page.goto('/register')
    await page.getByLabel(/email/i).fill(submitterEmail)
    await page.getByLabel(/display name/i).fill('Submitter User')
    await page.getByLabel(/^password/i).fill('Password1!')
    await page.getByRole('button', { name: /register/i }).click()
    await expect(page).toHaveURL('/dashboard')

    await page.getByRole('link', { name: /ideas/i }).click()
    await page.getByRole('link', { name: /new idea|submit/i }).click()
    await page.getByLabel(/title/i).fill('My E2E Idea')
    await page.getByLabel(/description/i).fill('This is a detailed description for E2E testing purposes.')
    await page.locator('select[name="category"]').selectOption('technology_innovation')
    await page.getByRole('button', { name: /submit/i }).click()
    await expect(page.getByText(/submitted/i)).toBeVisible()

    // 2. Logout submitter
    await page.getByRole('button', { name: /logout/i }).click()

    // 3. Login as admin
    await page.getByLabel(/email/i).fill('admin@epam.com')
    await page.getByLabel(/password/i).fill('Admin1234!')
    await page.getByRole('button', { name: /sign in/i }).click()

    // 4. Navigate to Idea Management
    await page.getByRole('link', { name: /idea management/i }).click()
    await expect(page).toHaveURL('/admin/ideas')

    // 5. Start Review on the idea
    await page.getByRole('button', { name: /start review/i }).first().click()
    await expect(page.getByText(/under review/i)).toBeVisible({ timeout: 5000 })

    // 6. Accept the idea
    await page.getByRole('button', { name: /accept/i }).first().click()
    await page.getByRole('button', { name: /confirm accept/i }).click()
    await expect(page.getByText(/accepted/i)).toBeVisible({ timeout: 5000 })
  })

  test('admin can reject an idea with a comment', async ({ page }) => {
    // 1. Register submitter and submit an idea
    const submitterEmail = `submitter${Date.now()}@epam.com`
    await page.goto('/register')
    await page.getByLabel(/email/i).fill(submitterEmail)
    await page.getByLabel(/display name/i).fill('Submitter User 2')
    await page.getByLabel(/^password/i).fill('Password1!')
    await page.getByRole('button', { name: /register/i }).click()

    await page.getByRole('link', { name: /ideas/i }).click()
    await page.getByRole('link', { name: /new idea|submit/i }).click()
    await page.getByLabel(/title/i).fill('Idea to Reject')
    await page.getByLabel(/description/i).fill('This idea will be rejected for testing.')
    await page.locator('select[name="category"]').selectOption('cost_reduction')
    await page.getByRole('button', { name: /submit/i }).click()

    // 2. Login as admin
    await page.getByRole('button', { name: /logout/i }).click()
    await page.getByLabel(/email/i).fill('admin@epam.com')
    await page.getByLabel(/password/i).fill('Admin1234!')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.getByRole('link', { name: /idea management/i }).click()

    // 3. Start Review then Reject
    await page.getByRole('button', { name: /start review/i }).first().click()
    await expect(page.getByText(/under review/i)).toBeVisible({ timeout: 5000 })

    await page.getByRole('button', { name: /reject/i }).first().click()
    await page.getByLabel(/rejection reason/i).fill('Not aligned with current priorities.')
    await page.getByRole('button', { name: /confirm reject/i }).click()
    await expect(page.getByText(/rejected/i)).toBeVisible({ timeout: 5000 })
  })

  test('admin cannot reject without providing a reason', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@epam.com')
    await page.getByLabel(/password/i).fill('Admin1234!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.getByRole('link', { name: /idea management/i }).click()

    // Find an under_review idea and try to reject without comment
    const rejectButtons = page.getByRole('button', { name: /reject/i })
    if ((await rejectButtons.count()) > 0) {
      await rejectButtons.first().click()
      await page.getByRole('button', { name: /confirm reject/i }).click()
      await expect(page.getByRole('alert')).toContainText(/rejection reason/i)
    }
  })
})

test.describe('US2 — Status Badge Visibility', () => {
  test('submitter sees status badge on their idea list', async ({ page }) => {
    const email = `statustest${Date.now()}@epam.com`
    await page.goto('/register')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/display name/i).fill('Status Test User')
    await page.getByLabel(/^password/i).fill('Password1!')
    await page.getByRole('button', { name: /register/i }).click()

    await page.getByRole('link', { name: /ideas/i }).click()
    await page.getByRole('link', { name: /new idea|submit/i }).click()
    await page.getByLabel(/title/i).fill('Status Visibility Test')
    await page.getByLabel(/description/i).fill('Testing that submitted status badge appears.')
    await page.locator('select[name="category"]').selectOption('workplace_culture')
    await page.getByRole('button', { name: /submit/i }).click()

    await page.getByRole('link', { name: /ideas/i }).click()
    await expect(page.getByText('Submitted')).toBeVisible()
  })
})

test.describe('US3 — Filter Ideas by Status', () => {
  test('admin can filter ideas by status', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@epam.com')
    await page.getByLabel(/password/i).fill('Admin1234!')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.getByRole('link', { name: /idea management/i }).click()
    await page.getByLabel(/filter ideas by status/i).selectOption('submitted')
    await expect(page).toHaveURL(/status=submitted/)
  })
})
