# ADR-0003: Tailwind CSS v4 with `@theme` Directive

**Status**: Accepted
**Date**: 2026-05-14
**Feature**: `001-user-auth-management`

---

## Context

The project constitution (Principle II) mandates Tailwind CSS as the only styling mechanism. The user has explicitly specified Tailwind's `@theme` directive for theme colour definitions. shadcn/ui is the required component library (Principle II).

Two major versions of Tailwind CSS are in active use: v3 (JavaScript config file) and v4 (CSS-first `@theme` directive). The choice has downstream effects on shadcn/ui initialisation, PostCSS configuration, and how theme tokens are defined and consumed.

## Decision

Use **Tailwind CSS v4** with the `@theme` directive in `app/globals.css`.

Theme tokens (colours, spacing overrides, font sizes) are defined in the `@theme` block as CSS custom properties, which Tailwind v4 automatically maps to utility classes.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-brand:       #1a56db;
  --color-brand-dark:  #1e429f;
  --color-destructive: #e02424;
  /* ... */
}
```

PostCSS configuration uses `@tailwindcss/postcss`. The `tailwind.config.js` file does **not** exist in a v4 project.

shadcn/ui is initialised with `npx shadcn@latest init`, selecting the Tailwind v4 option when prompted.

## Rationale

- **Explicitly required** by user specification.
- **CSS custom properties**: `@theme` tokens are emitted as CSS variables (`var(--color-brand)`), making them accessible in arbitrary CSS and in JavaScript (via `getComputedStyle`) without a build step.
- **No JavaScript config**: Eliminates the `tailwind.config.js` file, reducing project configuration surface area.
- **shadcn/ui support**: The shadcn/ui component registry supports Tailwind v4 — components are generated with v4-compatible class names.
- **Future-proof**: Tailwind v4 is the active development branch; v3 is in maintenance mode.

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **Tailwind CSS v3 with `tailwind.config.js`** | Not specified by user. v3 uses a JavaScript config for theme extension — valid but being superseded by v4's CSS-first approach. |

## Consequences

- **Positive**: CSS custom properties for all theme tokens — accessible in both Tailwind utilities and raw CSS without duplication.
- **Positive**: No JavaScript configuration file to maintain for theme changes.
- **Neutral**: Tailwind v4's PostCSS plugin (`@tailwindcss/postcss`) is required instead of the v3 `tailwindcss` PostCSS plugin.
- **Neutral**: The `tailwind.config.js` content-path configuration from v3 is replaced by v4's automatic content detection.
- **Watch out**: Some community tutorials and shadcn/ui documentation examples still use v3 syntax. When copying component code from external sources, verify class names are v4-compatible.
