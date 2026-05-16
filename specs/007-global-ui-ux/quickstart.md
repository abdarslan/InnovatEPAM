# Quickstart: Global App UI System

## Goal

Verify that the application presents one shared visual system across public, auth, and protected routes.

## Review Checklist
1. Open a public route such as the login or register screen.
2. Open a protected route such as the dashboard or ideas area.
3. Compare typography, spacing, color hierarchy, cards, form fields, and feedback states.
4. Resize the viewport to mobile, tablet, and desktop widths.
5. Confirm keyboard navigation and visible focus states on interactive elements.
6. Check loading, empty, and error states on representative screens.

## Validation Commands

```bash
npm run type-check
npm run lint
npx vitest run components/layout/PageSurface.test.tsx components/layout/StateSurface.test.tsx
```

## Implementation Notes
- Keep styling in Tailwind utilities and the existing `@theme` token system.
- Prefer shared shadcn/ui components for buttons, cards, dialogs, inputs, and alerts.
- Update route-group layouts and shared layout components rather than introducing new visual frameworks.
- Preserve the same core visual identity across auth and protected routes; only the layout purpose should differ.
- During the current implementation phase, keep validation at component scope; integration and E2E work are deferred.

## Success Evidence
- Representative routes look like one product.
- Shared UI states feel consistent everywhere.
- No important control is hidden or overlapped at standard breakpoints.
- Loading, empty, and error states still fit the same visual system.
- Current evidence: root layout, auth layout, shared page/state surfaces, and representative route pages have been updated to the shared visual system.
- Current component validation: `PageSurface.test.tsx` and `StateSurface.test.tsx` pass.
- Covered route examples now include login, register, dashboard, ideas, admin dashboard, admin users, admin ideas, admin idea field rules, and access-denied.