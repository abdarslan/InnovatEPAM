# Visual System Contract

## Scope
This contract applies to every route in the application, including public, auth, and protected areas.

## Requirements
- All screens must use the shared global theme tokens for color, typography, spacing, elevation, and focus styling.
- The application must present one recognizable brand identity across the full route set.
- Route-specific layouts may vary in purpose, but they must not introduce a separate visual language.
- Shared surfaces such as cards, forms, dialogs, alerts, lists, and tables must remain visually aligned.

## Acceptance Rules
- A representative public screen and a representative protected screen should appear as part of the same product family.
- Auth screens may have different content framing, but they must still follow the shared theme.
- Any deviation from the shared system requires an explicit product decision.