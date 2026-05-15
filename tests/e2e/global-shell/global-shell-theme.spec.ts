import { test, expect } from '@playwright/test'

test.describe('US2 — Global shell theme consistency', () => {
  test('applies shell theme tokens to topbar and sidebar surfaces', async ({ page }) => {
    await page.goto('/register')
    const email = `shelltheme${Date.now()}@epam.com`
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/display name/i).fill('Shell Theme User')
    await page.getByLabel(/^password/i).fill('Password1')
    await page.getByRole('button', { name: /register/i }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 30_000 })

    await page.setViewportSize({ width: 1280, height: 900 })

    const topbar = page.getByRole('banner')
    const sidebar = page.getByRole('complementary')

    await expect(topbar).toBeVisible()
    await expect(page.getByRole('navigation', { name: /primary/i })).toBeVisible()
    await expect(sidebar).toBeVisible()

    const expected = await page.evaluate(() => {
      function resolveVariableColor(cssVariable: string): string {
        const probe = document.createElement('div')
        probe.style.backgroundColor = `var(${cssVariable})`
        document.body.appendChild(probe)
        const computed = window.getComputedStyle(probe).backgroundColor
        probe.remove()
        return computed
      }

      return {
        sidebarExpected: resolveVariableColor('--color-shell-sidebar'),
        topbarExpected: resolveVariableColor('--color-shell-topbar'),
      }
    })

    const sidebarActual = await sidebar.evaluate((element) => window.getComputedStyle(element).backgroundColor)
    const topbarActual = await topbar.evaluate((element) => window.getComputedStyle(element).backgroundColor)

    expect(sidebarActual).toBe(expected.sidebarExpected)
    expect(topbarActual).toBe(expected.topbarExpected)
  })
})