# Contract: Global Shell Layout

## Purpose

Define layout-level behavior that must hold for all protected routes.

## Inputs

- Current route context
- Current viewport breakpoint
- Current authenticated user context

## Outputs

- Top bar visible on all protected routes
- Left navigation system available on all protected routes
- Brand header visible at top of sidebar
- Reserved top-bar placeholder rendered as non-interactive region

## Behavioral Guarantees

1. Desktop renders fixed sidebar.
2. Tablet/mobile renders off-canvas sidebar opened from top-bar toggle.
3. Route transition does not remove shell frame.
4. Placeholder keeps stable alignment and minimum footprint per responsive tier.

## Acceptance Contract

- Protected route snapshot must always include shell containers.
- Breakpoint transition must not create shell duplication or orphaned drawer state.
