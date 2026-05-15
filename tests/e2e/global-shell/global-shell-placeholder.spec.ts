import { test, expect } from '@playwright/test'

test.describe('US3 — Topbar placeholder stability', () => {
  test('keeps placeholder alignment and footprint across route navigation', async ({ page }) => {
    await page.goto('/register')
    const email = `shellplaceholder${Date.now()}@epam.com`
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/display name/i).fill('Shell Placeholder User')
    await page.getByLabel(/^password/i).fill('Password1')
    await page.getByRole('button', { name: /register/i }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 30_000 })

    await page.setViewportSize({ width: 1280, height: 900 })

    const placeholder = page.getByTestId('search-placeholder')
    await expect(placeholder).toBeVisible()

    const before = await placeholder.boundingBox()
    expect(before).not.toBeNull()

    await page.getByRole('link', { name: /ideas/i }).click()
    await expect(page).toHaveURL('/ideas')

    const after = await placeholder.boundingBox()
    expect(after).not.toBeNull()

    const widthDelta = Math.abs((before?.width ?? 0) - (after?.width ?? 0))
    const xDelta = Math.abs((before?.x ?? 0) - (after?.x ?? 0))

    expect(widthDelta).toBeLessThanOrEqual(1)
    expect(xDelta).toBeLessThanOrEqual(1)
  })
})