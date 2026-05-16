# Accessibility and State Contract

## Scope
This contract applies to all interactive and stateful UI across the app.

## Requirements
- Interactive controls must provide visible default, hover, focus, active, and disabled states.
- All non-text content must have a text alternative.
- Text and controls must meet WCAG AA contrast requirements.
- Keyboard navigation must be logical and visible across public, auth, and protected routes.
- Loading, empty, and error states must be understandable and not rely on color alone.

## Acceptance Rules
- A keyboard-only user can complete common interactions without losing focus context.
- A screen reader user can understand the purpose of shared controls and states.
- State feedback must remain consistent across route groups and screen sizes.