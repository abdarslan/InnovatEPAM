import { expect, test } from '@playwright/test'

test.describe('Anonymous evaluation flow', () => {
  test('admin can evaluate stages 1-4 with mandatory ratings on stages 2-4', async ({ page }) => {
    if (process.env.E2E_ANON_FLOW !== 'true') {
      test.skip(true, 'Set E2E_ANON_FLOW=true to run the full anonymous evaluation flow.')
    }

    const email = process.env.E2E_ADMIN_EMAIL
    const password = process.env.E2E_ADMIN_PASSWORD
    const ideaTitle = process.env.E2E_ANON_IDEA_TITLE

    if (!email || !password || !ideaTitle) {
      test.skip(true, 'Missing E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, or E2E_ANON_IDEA_TITLE')
    }

    await page.goto('/login')
    await page.getByLabel(/email/i).fill(email!)
    await page.getByLabel(/password/i).fill(password!)
    await page.getByRole('button', { name: /sign in|login/i }).click()

    await page.goto('/admin/ideas')
    await page.getByRole('button', { name: /view details/i }).first().click()

    await expect(page.getByText(new RegExp(ideaTitle!, 'i'))).toBeVisible()

    await page.getByRole('button', { name: /approve to next stage/i }).click()
    await page.getByLabel(/decision comment/i).fill('Stage 1 triage passed.')
    await page.getByRole('button', { name: /confirm decision/i }).click()

    await page.getByRole('button', { name: /approve to next stage/i }).click()
    await page.getByRole('radio', { name: /alignment rating 4 of 5/i }).click()
    await page.getByLabel(/decision comment/i).fill('Strong strategic alignment.')
    await page.getByRole('button', { name: /confirm decision/i }).click()

    await page.getByRole('button', { name: /approve to next stage/i }).click()
    await page.getByRole('radio', { name: /feasibility rating 4 of 5/i }).click()
    await page.getByLabel(/decision comment/i).fill('Feasible with current capacity.')
    await page.getByRole('button', { name: /confirm decision/i }).click()

    await page.getByRole('button', { name: /final approve/i }).click()
    await page.getByRole('radio', { name: /impact rating 5 of 5/i }).click()
    await page.getByLabel(/decision comment/i).fill('High impact and approved for completion.')
    await page.getByRole('button', { name: /confirm decision/i }).click()

    await expect(page.getByText(/alignment 4\/5/i)).toBeVisible()
    await expect(page.getByText(/feasibility 4\/5/i)).toBeVisible()
    await expect(page.getByText(/impact 5\/5/i)).toBeVisible()
  })
})
