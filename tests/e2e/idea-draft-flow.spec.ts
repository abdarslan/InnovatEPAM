import { test, expect } from '@playwright/test'

// E2E tests for feature 005: Idea Draft Management
// Populated in T024 (US2) and T031 (US3)

test.describe('idea draft flow', () => {
  test.fixme('T024: dashboard shows only current submitter drafts', async ({ page }) => {
    // Steps:
    // 1. Log in as submitterA and save a draft
    // 2. Log out and log in as submitterB
    // 3. Navigate to /dashboard — verify submitterB draft list is empty (submitterA draft not visible)
    // 4. Log back in as submitterA — verify their draft appears
  })

  test.fixme('T031: resume draft and submit removes draft from dashboard', async ({ page }) => {
    // Steps:
    // 1. Log in as submitter and save a draft (partial content)
    // 2. Navigate to /dashboard — verify draft row appears
    // 3. Click Continue — verify form is prefilled with draft content
    // 4. Fill remaining required fields and click Submit Idea
    // 5. Navigate to /dashboard — verify draft row is gone
    // 6. Navigate to /ideas — verify submitted idea appears
  })
})
