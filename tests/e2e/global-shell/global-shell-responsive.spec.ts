import { test, expect } from '@playwright/test'

test.describe('US1 — Global shell responsive behavior', () => {
  test('shows off-canvas menu toggle on mobile and opens navigation panel', async ({ page }) => {
    await page.goto('/register')
    const email = `shellmobile${Date.now()}@epam.com`
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/display name/i).fill('Shell Mobile User')
    await page.getByLabel(/^password/i).fill('Password1')
    await page.getByRole('button', { name: /register/i }).click()
    await expect(page).toHaveURL('/dashboard')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: /open navigation|menu/i }).click()
    await expect(page.getByRole('link', { name: /ideas/i })).toBeVisible()
  })
})
