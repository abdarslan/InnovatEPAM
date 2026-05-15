# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: global-shell\global-shell-placeholder.spec.ts >> US3 — Topbar placeholder stability >> keeps placeholder alignment and footprint across route navigation
- Location: tests\e2e\global-shell\global-shell-placeholder.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/ideas"
Received: "http://localhost:3000/dashboard"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    7 × unexpected value "http://localhost:3000/dashboard"
    - waiting for" http://localhost:3000/dashboard" navigation to finish...
    - navigated to "http://localhost:3000/dashboard"
    5 × unexpected value "http://localhost:3000/dashboard"

```

```yaml
- complementary:
  - text: InnovatEPAM
  - navigation "Primary":
    - link "Dashboard":
      - /url: /dashboard
    - link "Ideas":
      - /url: /ideas
- banner:
  - text: Shell Placeholder User
  - button "Logout"
- main:
  - heading "Dashboard" [level=1]
  - paragraph: Welcome back, Shell Placeholder User
  - term: "Name:"
  - definition: Shell Placeholder User
  - term: "Email:"
  - definition: shellplaceholder1778819754619@epam.com
  - term: "Role:"
  - definition: submitter
  - region "Your Drafts":
    - heading "Your Drafts" [level=2]
    - link "New Idea":
      - /url: /ideas/new
    - paragraph:
      - text: No drafts yet. Start a new idea and click
      - strong: Save Draft
      - text: to save your progress.
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('US3 — Topbar placeholder stability', () => {
  4  |   test('keeps placeholder alignment and footprint across route navigation', async ({ page }) => {
  5  |     await page.goto('/register')
  6  |     const email = `shellplaceholder${Date.now()}@epam.com`
  7  |     await page.getByLabel(/email/i).fill(email)
  8  |     await page.getByLabel(/display name/i).fill('Shell Placeholder User')
  9  |     await page.getByLabel(/^password/i).fill('Password1')
  10 |     await page.getByRole('button', { name: /register/i }).click()
  11 |     await expect(page).toHaveURL('/dashboard', { timeout: 30_000 })
  12 | 
  13 |     await page.setViewportSize({ width: 1280, height: 900 })
  14 | 
  15 |     const placeholder = page.getByTestId('search-placeholder')
  16 |     await expect(placeholder).toBeVisible()
  17 | 
  18 |     const before = await placeholder.boundingBox()
  19 |     expect(before).not.toBeNull()
  20 | 
  21 |     await page.getByRole('link', { name: /ideas/i }).click()
> 22 |     await expect(page).toHaveURL('/ideas')
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  23 | 
  24 |     const after = await placeholder.boundingBox()
  25 |     expect(after).not.toBeNull()
  26 | 
  27 |     const widthDelta = Math.abs((before?.width ?? 0) - (after?.width ?? 0))
  28 |     const xDelta = Math.abs((before?.x ?? 0) - (after?.x ?? 0))
  29 | 
  30 |     expect(widthDelta).toBeLessThanOrEqual(1)
  31 |     expect(xDelta).toBeLessThanOrEqual(1)
  32 |   })
  33 | })
```