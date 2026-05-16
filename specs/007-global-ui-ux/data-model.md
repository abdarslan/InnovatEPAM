# Data Model: Global App UI System

This feature does not introduce new persistence entities. The model below describes the shared UI concepts that must stay consistent across the application.

## Entities

### VisualThemeTokenSet
- **Purpose**: The shared token set that defines color, typography, spacing, elevation, radius, and focus styling.
- **Fields**:
  - `primaryColor`
  - `secondaryColor`
  - `tertiaryColor`
  - `neutralColor`
  - `surfaceLevels`
  - `textColors`
  - `fontFamilies`
  - `radiusScale`
  - `elevationScale`
- **Validation rules**:
  - Tokens must map to the approved global theme.
  - Contrast-sensitive tokens must satisfy WCAG AA.
  - Decorative variations must not change semantic roles.

### ScreenSurfaceProfile
- **Purpose**: The structure of a screen, including title area, content area, supporting actions, and state surfaces.
- **Fields**:
  - `routeCategory`
  - `pageTitleArea`
  - `mainContentRegion`
  - `supportingActionArea`
  - `stateSurfaceRules`
  - `responsiveLayoutRules`
- **Relationships**:
  - Uses one `VisualThemeTokenSet`.
  - May reuse one or more `SharedUiPattern` definitions.
- **Validation rules**:
  - Must preserve a recognizable page hierarchy.
  - Must remain stable across mobile, tablet, and desktop sizes.

### SharedUiPattern
- **Purpose**: A reusable presentation pattern for common UI surfaces.
- **Fields**:
  - `patternName`
  - `allowedVariants`
  - `defaultState`
  - `hoverState`
  - `focusState`
  - `activeState`
  - `disabledState`
  - `loadingState`
  - `emptyState`
  - `errorState`
- **Relationships**:
  - Inherits `VisualThemeTokenSet` rules.
  - Is used by multiple `ScreenSurfaceProfile` instances.
- **Validation rules**:
  - State transitions must remain visually consistent.
  - Each state must be readable and accessible.

### BrandPresentation
- **Purpose**: The application identity treatment shown across routes.
- **Fields**:
  - `appName`
  - `logoAsset`
  - `fallbackText`
  - `displayRules`
- **Relationships**:
  - Uses the global theme tokens.
  - Appears in auth and protected layouts where branding is shown.
- **Validation rules**:
  - Must degrade gracefully if the logo asset is unavailable.
  - Must not break layout when the app name is long.

## State Transitions

### Shared UI State Flow
- `default` -> `hover` / `focus` / `active` / `disabled`
- `loading` -> `ready`
- `ready` -> `empty` / `error`

### Layout Flow
- Public route surface -> Auth route surface -> Protected route surface
- Each surface remains part of the same visual system, even when the page purpose changes.

## Notes

- The feature is presentation-only and does not add new persisted data.
- Route-specific exceptions should remain rare and explicit.