import { test, expect } from '@playwright/test'

test.describe('US1 — Global shell accessibility keyboard flow', () => {
  test('opens drawer with toggle and closes with Escape', async ({ page }) => {
    await page.goto('/register')
    const email = `shella11y${Date.now()}@epam.com`
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/display name/i).fill('Shell A11y User')
    await page.getByLabel(/^password/i).fill('Password1')
    await page.getByRole('button', { name: /register/i }).click()
    await expect(page).toHaveURL('/dashboard')

    await page.setViewportSize({ width: 390, height: 844 })
    const toggle = page.getByRole('button', { name: /open navigation|menu/i })
    await toggle.click()
    await expect(
      page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /^ideas$/i }),
    ).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(
      page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /^ideas$/i }),
    ).not.toBeVisible()
    await expect(toggle).toBeFocused()
  })
})
