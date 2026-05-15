# Contract: Sidebar Authorization Visibility

## Purpose

Define strict rendering rules for role/permission-aware sidebar navigation.

## Inputs

- Candidate navigation item list
- Current user authorization context
- Current route path

## Outputs

- Rendered navigation list containing authorized items only
- Active state marker for current destination when visible

## Behavioral Guarantees

1. Unauthorized destinations are not rendered in any visual state.
2. No disabled or locked placeholders are shown for unauthorized items.
3. Active state appears only on an authorized, rendered destination.

## Acceptance Contract

- For a user lacking permission `P`, destinations requiring `P` must be absent from DOM.
- For users with overlapping permissions, only matching authorized destinations are rendered.
