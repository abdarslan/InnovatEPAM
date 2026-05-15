import { expect, test, type Page } from '@playwright/test'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/dashboard/)
}

async function registerSubmitter(page: Page, email: string, displayName: string, password: string) {
  await page.goto('/register')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/display name/i).fill(displayName)
  await page.getByLabel(/^password/i).fill(password)
  await page.getByRole('button', { name: /register/i }).click()
  await expect(page).toHaveURL('/dashboard')
}

async function logout(page: Page) {
  await page.getByRole('button', { name: /logout/i }).click()
  await expect(page).toHaveURL(/\/login/)
}

async function submitIdea(page: Page, title: string, description: string) {
  await page.goto('/ideas')
  await page.getByRole('link', { name: /submit an idea/i }).click()
  await page.getByLabel(/title/i).fill(title)
  await page.getByLabel(/description/i).fill(description)
  await page.locator('select[name="category"]').selectOption('workplace_culture')

  const dynamicInputs = page.locator('[id^="dynamic_"]')
  const dynamicInputCount = await dynamicInputs.count()
  for (let i = 0; i < dynamicInputCount; i += 1) {
    const input = dynamicInputs.nth(i)
    const inputType = await input.getAttribute('type')
    if (inputType === 'date') {
      await input.fill('2026-12-01')
    } else if (inputType === 'number') {
      await input.fill('10')
    } else {
      await input.fill('Autofilled detail')
    }
  }

  await page.getByRole('button', { name: /submit idea/i }).click()
  await expect(page).toHaveURL('/ideas')
}

async function applyDecisionOnRow(page: Page, ideaTitle: string, decisionButton: RegExp, comment: string) {
  const row = page.locator('li', { hasText: ideaTitle }).first()
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: decisionButton }).click()
  await row.getByLabel(/decision comment/i).fill(comment)
  await row.getByRole('button', { name: /confirm decision/i }).click()
}

test.describe('idea evaluation workflow', () => {
  test('admin completes 4-stage pipeline and visibility rule B is enforced', { timeout: 120000 }, async ({ page }) => {
    test.setTimeout(120000)
    const ts = Date.now()
    const submitterEmail = `spec3-submitter-${ts}@epam.com`
    const otherViewerEmail = `spec3-viewer-${ts}@epam.com`
    const password = 'Password1!'
    const ideaTitle = `Spec3 Stage Workflow ${ts}`

    await registerSubmitter(page, submitterEmail, 'Spec 3 Submitter', password)
    await submitIdea(page, ideaTitle, 'E2E validation for 4-stage idea evaluation workflow.')
    await logout(page)

    await login(page, 'admin@epam.com', 'Admin1234!')
    await expect(page).toHaveURL('/admin/dashboard')
    await page.goto('/admin/ideas')

    await applyDecisionOnRow(page, ideaTitle, /approve to next stage/i, 'Triage approval comment.')
    await applyDecisionOnRow(page, ideaTitle, /approve to next stage/i, 'Department approval comment.')
    await applyDecisionOnRow(page, ideaTitle, /approve to next stage/i, 'Feasibility approval comment.')
    await applyDecisionOnRow(page, ideaTitle, /final approve/i, 'Final executive approval comment.')

    const adminRow = page.locator('li', { hasText: ideaTitle }).first()
    await expect(adminRow.getByText(/final approved|accepted/i).first()).toBeVisible()
    await logout(page)

    await login(page, submitterEmail, password)
    await page.goto('/ideas')
    await page.locator('button', { hasText: ideaTitle }).click()
    await expect(page.getByText(/timeline/i)).toBeVisible()
    await expect(page.getByText(/final executive approval comment\./i)).toBeVisible()
    await logout(page)

    await registerSubmitter(page, otherViewerEmail, 'Spec 3 Other Viewer', password)
    await page.goto('/ideas')
    await page.locator('button', { hasText: ideaTitle }).click()
    await expect(page.getByText(/timeline/i)).toBeVisible()
    await expect(page.getByText(/final approved|accepted/i).first()).toBeVisible()
    await expect(page.getByText(/comment:/i)).toHaveCount(0)
  })
})
