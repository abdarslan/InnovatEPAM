import { test, expect } from '@playwright/test'

test('submits event plan idea with optional dynamic fields left empty', async ({ page }) => {
  const submitterEmail = `dynamic${Date.now()}@epam.com`

  await page.goto('/register')
  await page.getByLabel(/email/i).fill(submitterEmail)
  await page.getByLabel(/display name/i).fill('Dynamic Form User')
  await page.getByLabel(/^password/i).fill('Password1!')
  await page.getByRole('button', { name: /register/i }).click()
  await expect(page).toHaveURL('/dashboard')

  await page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /^ideas$/i }).click()
  await page.getByRole('link', { name: /new idea|submit/i }).click()

  await page.getByLabel(/title/i).fill('Event Plan Without Optional Fields')
  await page.getByLabel(/description/i).fill('This submission verifies optional event plan category fields can be empty.')
  await page.locator('select[name="category"]').selectOption('event_plan')

  await expect(page.getByLabel(/planned date/i)).toBeVisible()
  await expect(page.getByLabel(/planned number of attendees/i)).toBeVisible()

  await page.getByRole('button', { name: /submit/i }).click()

  await expect(page).toHaveURL('/ideas')
  await expect(page.getByText(/event plan without optional fields/i).first()).toBeVisible()
})

test('drops non-applicable dynamic values after category switch', async ({ page }) => {
  const submitterEmail = `switch${Date.now()}@epam.com`

  await page.goto('/register')
  await page.getByLabel(/email/i).fill(submitterEmail)
  await page.getByLabel(/display name/i).fill('Dynamic Switch User')
  await page.getByLabel(/^password/i).fill('Password1!')
  await page.getByRole('button', { name: /register/i }).click()
  await expect(page).toHaveURL('/dashboard')

  await page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /^ideas$/i }).click()
  await page.getByRole('link', { name: /new idea|submit/i }).click()

  await page.getByLabel(/title/i).fill('Switch Category Drops Values')
  await page.getByLabel(/description/i).fill('This verifies stale dynamic fields are ignored after category changes.')
  await page.locator('select[name="category"]').selectOption('event_plan')

  await page.getByLabel(/planned date/i).fill('2026-12-10')
  await page.getByLabel(/planned number of attendees/i).fill('200')

  await page.locator('select[name="category"]').selectOption('process_improvement')
  await expect(page.getByLabel(/planned date/i)).toHaveCount(0)
  await expect(page.getByLabel(/planned number of attendees/i)).toHaveCount(0)

  await page.getByRole('button', { name: /submit/i }).click()

  await expect(page).toHaveURL('/ideas')
  await expect(page.getByText(/switch category drops values/i).first()).toBeVisible()
  await expect(page.getByText(/2026-12-10/i)).toHaveCount(0)
})
