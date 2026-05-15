# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: global-shell\global-shell-responsive.spec.ts >> US1 — Global shell responsive behavior >> shows off-canvas menu toggle on mobile and opens navigation panel
- Location: tests\e2e\global-shell\global-shell-responsive.spec.ts:4:7

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
  3  | test.describe('US1 — Global shell responsive behavior', () => {
  4  |   test('shows off-canvas menu toggle on mobile and opens navigation panel', async ({ page }) => {
  5  |     await page.goto('/register')
  6  |     const email = `shellmobile${Date.now()}@epam.com`
> 7  |     await page.getByLabel(/email/i).fill(email)
     |                                     ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  8  |     await page.getByLabel(/display name/i).fill('Shell Mobile User')
  9  |     await page.getByLabel(/^password/i).fill('Password1')
  10 |     await page.getByRole('button', { name: /register/i }).click()
  11 |     await expect(page).toHaveURL('/dashboard')
  12 | 
  13 |     await page.setViewportSize({ width: 390, height: 844 })
  14 |     await page.getByRole('button', { name: /open navigation|menu/i }).click()
  15 |     await expect(page.getByRole('link', { name: /ideas/i })).toBeVisible()
  16 |   })
  17 | })
  18 | 
```