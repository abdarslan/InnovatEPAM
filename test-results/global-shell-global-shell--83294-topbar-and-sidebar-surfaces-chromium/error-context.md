# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: global-shell\global-shell-theme.spec.ts >> US2 — Global shell theme consistency >> applies shell theme tokens to topbar and sidebar surfaces
- Location: tests\e2e\global-shell\global-shell-theme.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel(/email/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - heading "404" [level=1] [ref=e3]
    - heading "Page Not Found" [level=2] [ref=e4]
    - paragraph [ref=e5]: The page you are looking for does not exist.
    - link "Go to Login" [ref=e6] [cursor=pointer]:
      - /url: /login
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e12] [cursor=pointer]:
    - img [ref=e13]
  - alert [ref=e16]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('US2 — Global shell theme consistency', () => {
  4  |   test('applies shell theme tokens to topbar and sidebar surfaces', async ({ page }) => {
  5  |     await page.goto('/register')
  6  |     const email = `shelltheme${Date.now()}@epam.com`
> 7  |     await page.getByLabel(/email/i).fill(email)
     |                                     ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  8  |     await page.getByLabel(/display name/i).fill('Shell Theme User')
  9  |     await page.getByLabel(/^password/i).fill('Password1')
  10 |     await page.getByRole('button', { name: /register/i }).click()
  11 |     await expect(page).toHaveURL('/dashboard', { timeout: 30_000 })
  12 | 
  13 |     await page.setViewportSize({ width: 1280, height: 900 })
  14 | 
  15 |     const topbar = page.getByRole('banner')
  16 |     const sidebar = page.getByRole('complementary')
  17 | 
  18 |     await expect(topbar).toBeVisible()
  19 |     await expect(page.getByRole('navigation', { name: /primary/i })).toBeVisible()
  20 |     await expect(sidebar).toBeVisible()
  21 | 
  22 |     const expected = await page.evaluate(() => {
  23 |       function resolveVariableColor(cssVariable: string): string {
  24 |         const probe = document.createElement('div')
  25 |         probe.style.backgroundColor = `var(${cssVariable})`
  26 |         document.body.appendChild(probe)
  27 |         const computed = window.getComputedStyle(probe).backgroundColor
  28 |         probe.remove()
  29 |         return computed
  30 |       }
  31 | 
  32 |       return {
  33 |         sidebarExpected: resolveVariableColor('--color-shell-sidebar'),
  34 |         topbarExpected: resolveVariableColor('--color-shell-topbar'),
  35 |       }
  36 |     })
  37 | 
  38 |     const sidebarActual = await sidebar.evaluate((element) => window.getComputedStyle(element).backgroundColor)
  39 |     const topbarActual = await topbar.evaluate((element) => window.getComputedStyle(element).backgroundColor)
  40 | 
  41 |     expect(sidebarActual).toBe(expected.sidebarExpected)
  42 |     expect(topbarActual).toBe(expected.topbarExpected)
  43 |   })
  44 | })
```