# ADR-0014: Global App UI Composition Across Route Groups

**Status**: Accepted
**Date**: 2026-05-15
**Feature**: `007-global-ui-ux`

## Context

The product already uses Next.js App Router with route-group layouts, a Tailwind v4 theme token system, and shared layout components. The new feature scope expands from a shell-focused UI to a whole-app visual system that must look consistent across public, auth, and protected routes.

The constitution requires Tailwind-only styling, shadcn/ui as the component base, responsive layouts, and no unnecessary new dependencies. The existing layout boundaries are already the natural places to apply the shared visual system.

## Decision

Use the existing App Router layout hierarchy as the composition boundary for the global UI system:

- `app/layout.tsx` provides the baseline application frame and theme bootstrap.
- `app/(auth)/layout.tsx` and `app/(protected)/layout.tsx` apply purpose-specific framing while staying inside the same visual system.
- Shared visual treatment lives in `app/globals.css` theme tokens and reusable components under `components/layout/` and `components/ui/`.
- No new design-system package or styling framework will be introduced.

## Rationale

- Keeps the visual system centralized in the route structure that already exists.
- Avoids parallel layout systems that would drift over time.
- Preserves the current Tailwind v4 and shadcn/ui architecture.
- Limits change surface area while still making the whole app feel cohesive.

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| New app-wide design-system package | Adds unnecessary abstraction and maintenance overhead for a UI-only scope. |
| Per-route bespoke styling | Would create inconsistent surfaces and undermine the clarified whole-app goal. |
| CSS-in-JS or custom CSS layers | Conflicts with the constitution and the existing Tailwind v4 approach. |

## Consequences

- Public, auth, and protected routes must all honor the shared theme tokens.
- Layouts may vary in purpose, but not in visual language.
- Shared UI patterns and state surfaces become the primary reuse mechanism.
- Validation must cover representative routes from each route group.

## Related Decisions

- [ADR-0003: Tailwind CSS v4 with `@theme` Directive](adr-0003-tailwind-theme-decision.md)