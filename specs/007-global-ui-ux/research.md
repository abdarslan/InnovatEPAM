# Research: Global App UI System

## Decision 1: Extend the existing Tailwind v4 theme across all route groups
- **Decision**: Keep the current Tailwind v4 `@theme` token approach as the single source of truth for colors, typography, spacing, elevation, and focus styling across public, auth, and protected routes.
- **Rationale**: The constitution requires Tailwind-only styling, and the repo already uses `@theme` tokens. Reusing the current system avoids adding another styling layer.
- **Alternatives considered**: A separate design-system package, CSS modules, or custom CSS. Rejected because they would split the visual system and add maintenance overhead.

## Decision 2: Use the existing App Router route groups as the composition boundary
- **Decision**: Apply the visual system through the current `app/layout.tsx`, `app/(auth)/layout.tsx`, and `app/(protected)/layout.tsx` structure instead of introducing a second shell architecture.
- **Rationale**: The application already centralizes layout concerns in the root layout and route-group layouts. That makes it the lowest-risk place to standardize the whole app.
- **Alternatives considered**: A new app-wide provider wrapper or a separate layout package. Rejected because they would duplicate responsibilities already handled by route groups.

## Decision 3: Standardize shared UI patterns and state surfaces
- **Decision**: Treat cards, forms, lists, tables, dialogs, alerts, loading states, empty states, and error states as part of the same visual system, not as route-specific exceptions.
- **Rationale**: The spec now covers the whole application, so state surfaces must look and behave consistently everywhere.
- **Alternatives considered**: Per-route bespoke states or keeping auth/public screens visually distinct. Rejected because they conflict with the clarified scope.

## Decision 4: Avoid new dependencies
- **Decision**: Implement the feature with existing stack pieces only: Next.js App Router, React 18+, Tailwind CSS v4, shadcn/ui, and the current auth/session stack.
- **Rationale**: The constitution discourages new dependencies without justification, and the current stack already covers the required behavior.
- **Alternatives considered**: Animation libraries, CSS-in-JS, or an external design system package. Rejected because they are unnecessary for the scope.

## Summary

All technical clarifications are resolved. No unresolved NEEDS CLARIFICATION items remain.

## Implementation Note

- The current implementation phase is intentionally component-focused.
- Integration and E2E validation remain deferred until a later phase is explicitly requested.
