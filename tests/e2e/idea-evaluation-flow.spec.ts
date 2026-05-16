import { test, expect } from '@playwright/test'

/**
 * E2E tests for the Idea Evaluation Workflow (Feature 003)
 *
 * Prerequisites: The app is seeded with at least one admin account.
 * These tests register fresh users per run and create ideas via UI.
 */

async function completeDecision(
  page: import('@playwright/test').Page,
  ideaTitle: string,
  decisionButton: RegExp,
  comment: string,
  includeRating = false,
) {
  const row = page.locator('li').filter({ hasText: ideaTitle }).first()
  await expect(row).toBeVisible({ timeout: 10000 })
  await row.getByRole('button', { name: decisionButton }).click()

  const decisionForm = row.locator('form').first()
  await expect(decisionForm).toBeVisible()
  await decisionForm.getByLabel(/decision comment/i).fill(comment)

  if (includeRating) {
    await decisionForm.getByRole('radio', { name: /4 of 5/i }).click()
  }

  await decisionForm.getByRole('button', { name: /confirm decision/i }).click()
}

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('admin@epam.com')
  await page.getByLabel(/password/i).fill('Admin1234!')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard|\/dashboard/, { timeout: 20000 })
}

test.describe('US1 — Admin Evaluates Ideas', () => {
  test('admin can navigate to Idea Management page', async ({ page }) => {
    // Register admin via seed — use the pre-existing admin from db:seed
    // For E2E we login with seeded admin credentials
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@epam.com')
    await page.getByLabel(/password/i).fill('Admin1234!')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for navigation to complete and check for dashboard elements instead of URL
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10000 })

    await page.getByRole('link', { name: /idea management/i }).click()
    await expect(page).toHaveURL('/admin/ideas')
    await expect(page.getByRole('heading', { name: /idea management/i })).toBeVisible()
  })

  test('admin can start review and then accept an idea', async ({ page, browser }) => {
    const ideaTitle = `My E2E Idea ${Date.now()}`

    // 1. Register submitter and submit an idea
    const submitterEmail = `submitter${Date.now()}@epam.com`
    await page.goto('/register')
    await page.getByLabel(/email/i).fill(submitterEmail)
    await page.getByLabel(/display name/i).fill('Submitter User')
    await page.getByLabel(/^password/i).fill('Password1!')
    await page.getByRole('button', { name: /register/i }).click()
    await expect(page).toHaveURL('/dashboard')

    await page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /^ideas$/i }).click()
    await page.getByRole('link', { name: /new idea|submit/i }).click()
    await page.getByLabel(/title/i).fill(ideaTitle)
    await page.getByLabel(/description/i).fill('This is a detailed description for E2E testing purposes.')
    await page.locator('select[name="category"]').selectOption('technology_innovation')
    await page.getByRole('button', { name: /submit/i }).click()
    await expect(page).toHaveURL('/ideas')
    // Wait for the idea list to stabilize and use a more specific locator with aria-label on the status badge
    await expect(page.locator(`button:has-text("${ideaTitle}")`).first().getByRole('status', { name: 'submitted' })).toBeVisible()
    // Remove the ambiguous getByText check
    // await expect(page.getByText(/submitted/i)).toBeVisible()

    // 2. Login as admin in a separate browser context.
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()

    try {
      await loginAsAdmin(adminPage)

      // 4. Navigate to Idea Management
      await adminPage.goto('/admin/ideas')
      await expect(adminPage).toHaveURL('/admin/ideas')

      // 5. Advance through all evaluation stages to final approval.
      await completeDecision(adminPage, ideaTitle, /approve to next stage/i, 'Triage approval')
      await completeDecision(adminPage, ideaTitle, /approve to next stage/i, 'Department approval', true)
      await completeDecision(adminPage, ideaTitle, /approve to next stage/i, 'Feasibility approval', true)
      await completeDecision(adminPage, ideaTitle, /final approve/i, 'Executive final approval', true)

      const ideaRow = adminPage.locator('li').filter({ hasText: ideaTitle }).first()
      await expect(ideaRow).toBeVisible({ timeout: 10000 })
      await expect
        .poll(async () => (await ideaRow.innerText()).toLowerCase(), { timeout: 20000 })
        .toMatch(/accepted|final approved|evaluation complete/)
    } finally {
      await adminContext.close()
    }
  })

  test('admin can reject an idea with a comment', async ({ page, browser }) => {
    const ideaTitle = `Idea to Reject ${Date.now()}`

    // 1. Register submitter and submit an idea
    const submitterEmail = `submitter${Date.now()}@epam.com`
    await page.goto('/register')
    await page.getByLabel(/email/i).fill(submitterEmail)
    await page.getByLabel(/display name/i).fill('Submitter User 2')
    await page.getByLabel(/^password/i).fill('Password1!')
    await page.getByRole('button', { name: /register/i }).click()

    await page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /^ideas$/i }).click()
    await page.getByRole('link', { name: /new idea|submit/i }).click()
    await page.getByLabel(/title/i).fill(ideaTitle)
    await page.getByLabel(/description/i).fill('This idea will be rejected for testing.')
    await page.locator('select[name="category"]').selectOption('workplace_culture')
    await page.getByRole('button', { name: /submit/i }).click()
    await expect(page).toHaveURL('/ideas')

    // 2. Login as admin in a separate browser context.
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()

    try {
      await loginAsAdmin(adminPage)
      await adminPage.goto('/admin/ideas')
      await expect(adminPage).toHaveURL('/admin/ideas')

      await completeDecision(adminPage, ideaTitle, /reject/i, 'Not aligned with current priorities.')
      const ideaRow = adminPage.locator('li').filter({ hasText: ideaTitle }).first()
      await expect(ideaRow.getByText(/rejected/i).first()).toBeVisible({ timeout: 10000 })
    } finally {
      await adminContext.close()
    }
  })

  test('admin cannot reject without providing a reason', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@epam.com')
    await page.getByLabel(/password/i).fill('Admin1234!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.getByRole('link', { name: /idea management/i }).click()

    // Try to reject without a decision comment
    const rejectButtons = page.getByRole('button', { name: /reject/i })
    if ((await rejectButtons.count()) > 0) {
      await rejectButtons.first().click()
      await page.getByRole('button', { name: /confirm decision/i }).click()
      await expect(
        page
          .locator('form p[role="alert"]')
          .filter({ hasText: /decision comment is required/i })
          .first(),
      ).toBeVisible()
    }
  })
})

test.describe('US2 — Status Badge Visibility', () => {
  test('submitter sees status badge on their idea list', async ({ page }) => {
    const email = `statustest${Date.now()}@epam.com`
    const ideaTitle = `Status Visibility Test ${Date.now()}`
    await page.goto('/register')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/display name/i).fill('Status Test User')
    await page.getByLabel(/^password/i).fill('Password1!')
    await page.getByRole('button', { name: /register/i }).click()

    await page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /^ideas$/i }).click()
    await page.getByRole('link', { name: /new idea|submit/i }).click()
    await page.getByLabel(/title/i).fill(ideaTitle)
    await page.getByLabel(/description/i).fill('Testing that submitted status badge appears.')
    await page.locator('select[name="category"]').selectOption('workplace_culture')
    await page.getByRole('button', { name: /submit/i }).click()
    await expect(page).toHaveURL('/ideas')

    await page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /^ideas$/i }).click()
    const row = page.locator('button').filter({ hasText: ideaTitle }).first()
    await expect(row).toBeVisible({ timeout: 10000 })
    await expect(row.getByRole('status', { name: 'submitted' })).toBeVisible({ timeout: 10000 })
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
