# Contract: Top-Bar Placeholder

## Purpose

Define the reserved future-search placeholder behavior in the top bar for current release.

## Inputs

- Current viewport breakpoint
- Global shell top-bar composition context

## Outputs

- Non-interactive placeholder region
- Fixed alignment position
- Minimum width footprint by breakpoint tier

## Behavioral Guarantees

1. Placeholder is present on all protected routes.
2. Placeholder is non-interactive in this release.
3. Placeholder footprint remains stable during navigation and viewport changes.
4. Adjacent top-bar controls do not shift due to placeholder resizing behavior.

## Acceptance Contract

- Keyboard focus cannot land on placeholder.
- Responsive checks confirm fixed alignment and minimum width contract per tier.
