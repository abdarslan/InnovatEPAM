# Quickstart: Global UI/UX Framework

## Goal

Implement and validate a consistent global shell for protected routes with responsive navigation, accessibility-compliant off-canvas behavior, authorization-aware nav visibility, and theme-driven token consistency.

## 1. Implement Global Shell Composition

1. Update protected layout composition to include:
   - Left navigation container
   - Top bar container
   - Reserved non-interactive top-bar placeholder
2. Ensure shell wraps all protected routes.

## 2. Implement Responsive Navigation Behavior

1. Desktop:
   - Sidebar visible and fixed.
2. Tablet/mobile:
   - Sidebar opened from top-bar toggle as off-canvas panel.
3. Ensure transition between breakpoint modes does not leave stale open state.

## 3. Implement Authorization-Aware Visibility

1. Compute authorized nav destinations from existing user/session context.
2. Render only authorized destinations in sidebar.
3. Validate active route indicator only for rendered destinations.

## 4. Implement Accessibility Controls (Off-canvas)

1. On open, focus first actionable navigation item.
2. Trap focus while panel is open.
3. Close on Escape.
4. Restore focus to opener toggle on close.

## 5. Enforce Theme and Placeholder Contracts

1. Apply exact core Aura Innovation tokens for semantic shell colors and headline/body typography.
2. Keep non-core decorative variation subtle and non-semantic.
3. Reserve stable placeholder alignment and minimum width across breakpoints.

## 6. Verification Checklist

1. Route coverage:
   - All protected routes show sidebar + top bar shell.
2. Responsive behavior:
   - Desktop fixed sidebar.
   - Tablet/mobile off-canvas via top toggle.
3. Authorization behavior:
   - Unauthorized destinations not rendered at all.
4. Accessibility:
   - Focus enter/trap/escape/restore works with keyboard only.
5. Theming:
   - Core shell tokens match specified design tokens.
6. Placeholder stability:
   - No adjacent control layout shift during resize/navigation.

## 7. Suggested Test Scope

- Unit/component:
  - Sidebar render filter logic
  - Active state indicator logic
  - Off-canvas focus lifecycle behavior
- Integration:
  - Protected layout shell composition + auth-derived nav
- E2E:
  - Keyboard-only mobile drawer flow
  - Cross-breakpoint shell behavior

## 8. Final Verification Commands and Evidence

Run these commands from repository root:

```bash
npm run type-check
npm run lint
npx vitest run components/layout/BrandHeader.test.tsx components/layout/SearchPlaceholder.test.tsx tests/integration/global-shell/global-shell-theme-contract.test.tsx tests/integration/global-shell/topbar-placeholder-contract.test.tsx
npx playwright test tests/e2e/global-shell/global-shell-theme.spec.ts
npx playwright test tests/e2e/global-shell/global-shell-placeholder.spec.ts
```

Current evidence snapshot:

1. Type checking passes (`tsc --noEmit`).
2. Lint passes with pre-existing warnings outside this feature scope:
   - tests/e2e/idea-draft-flow.spec.ts
   - tests/integration/ideas/draft-actions.test.ts
3. New US2/US3 unit and integration tests pass (7/7).
4. US2 theme E2E and US3 placeholder E2E each pass when run individually.
5. Running multiple global-shell E2E specs in one command is currently unstable in local Next dev mode due intermittent framework/runtime issues (for example `clientReferenceManifest` invariant and occasional register-flow timing instability).