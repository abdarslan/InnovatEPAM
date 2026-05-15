# Data Model: Global UI/UX Framework

## Overview

This feature adds no new database persistence. The model is UI-domain and contract-driven.

## Entities

## 1. GlobalNavigationItem

- Purpose: Represents one visible destination in left navigation.
- Fields:
  - id: string
  - label: string
  - href: string
  - iconKey: string (optional)
  - isActive: boolean
  - isAuthorized: boolean (computed before render)
- Rules:
  - Render only when isAuthorized is true.
  - Exactly one item may be active per route context.

## 2. BrandHeader

- Purpose: Represents top-of-sidebar identity block.
- Fields:
  - appName: string
  - logoSrc: string | null
  - hasLogoFallback: boolean
- Rules:
  - If logo cannot be loaded, appName remains visible with text-only fallback.
  - Must remain layout-stable for long app names.

## 3. TopBarPlaceholder

- Purpose: Non-interactive reserved region for future search.
- Fields:
  - alignment: "left" | "center" | "right"
  - minWidthByBreakpoint: { mobile: string; tablet: string; desktop: string }
  - isInteractive: false
- Rules:
  - Always non-interactive in this feature scope.
  - Maintains stable footprint to avoid layout shift on resize/navigation.

## 4. ShellViewportMode

- Purpose: Defines shell rendering strategy by breakpoint.
- Values:
  - desktopFixedSidebar
  - tabletOffCanvas
  - mobileOffCanvas
- Rules:
  - Desktop mode keeps sidebar visible.
  - Tablet/mobile require toggle + off-canvas pattern.

## 5. OffCanvasFocusSession

- Purpose: Tracks accessibility state while mobile/tablet drawer is open.
- Fields:
  - openedFromToggleId: string
  - firstFocusableNavItemId: string
  - focusTrapEnabled: boolean
  - isOpen: boolean
- Rules:
  - On open: focus firstFocusableNavItemId.
  - While open: focus trap enabled.
  - On Escape or close action: close and restore focus to openedFromToggleId.

## Relationships

- ShellViewportMode controls how GlobalNavigationItem collection is displayed.
- BrandHeader is a fixed child of sidebar container.
- TopBarPlaceholder is a fixed child of top bar layout.
- OffCanvasFocusSession applies only in tabletOffCanvas/mobileOffCanvas modes.

## Derived/Computed Data

- AuthorizedNavItems = filter(GlobalNavigationItem, isAuthorized == true)
- ActiveNavItem = AuthorizedNavItems where isActive == true
- PlaceholderFootprint = minWidthByBreakpoint[currentBreakpoint]

## State Transitions

## Off-canvas lifecycle

1. closed -> opening
2. opening -> open (focus moved to first actionable nav item)
3. open -> closing (Escape, overlay click, explicit close)
4. closing -> closed (focus restored to toggle)

## Breakpoint lifecycle

1. desktopFixedSidebar -> tabletOffCanvas (on downsize)
2. tabletOffCanvas -> mobileOffCanvas (on further downsize)
3. mobile/tablet off-canvas -> desktopFixedSidebar (on upsize; close drawer if open)

## Validation Notes

- Authorization filtering is mandatory before render; no unauthorized ghost entries.
- Top-bar placeholder contract is validated by layout stability checks across responsive states.