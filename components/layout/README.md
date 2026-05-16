# Global Layout Components

This folder hosts shared layout components for the whole application, including auth and protected route groups.

Guidelines:
- Keep behavior separated by concern (surface framing, shared states, navigation, brand header, focus management).
- Use Tailwind utilities and existing design tokens only.
- Keep accessibility behavior explicit and testable.
- Prefer route-group layouts and shared primitives over one-off page styling.

Shared components:
- AppSidebar.tsx
- AppTopbar.tsx
- BrandHeader.tsx
- SearchPlaceholder.tsx
- ProtectedShell.tsx
- useOffCanvasNavigation.ts
