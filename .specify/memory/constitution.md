<!--
  SYNC IMPACT REPORT
  Version change: 1.0.0 → 1.1.0
  Modified principles: None
  Added sections:
    - VI. Architecture Decision Records (new principle)
  Removed sections: N/A
  Templates updated:
    - .specify/templates/plan-template.md ✅ (Constitution Check gate added for ADRs)
    - .specify/templates/tasks-template.md ✅ (Phase 1 setup task added for ADR directory)
  Follow-up TODOs: None
-->

# InnovatEPAM Constitution

## Core Principles

### I. Clean Code (NON-NEGOTIABLE)
Every unit of code MUST be readable, purposeful, and minimal.
- Functions MUST do one thing; name them after what they do, not how.
- No dead code, commented-out blocks, or redundant abstractions.
- Variables and components MUST have intention-revealing names.
- Duplication MUST be eliminated through proper abstraction, not copy-paste.
- Code complexity MUST be justified — if it cannot be explained simply, it MUST be simplified.

### II. Simple, Responsive UI/UX with Tailwind (NON-NEGOTIABLE)
Every UI component MUST be simple, responsive, and built with Tailwind CSS.
- Tailwind utility classes are the ONLY styling mechanism; no custom CSS files unless absolutely unavoidable and documented.
- Layouts MUST be mobile-first and responsive across all breakpoints (sm, md, lg, xl).
- UI MUST use shadcn/ui components as the primary component library — no reinventing primitives.
- Visual hierarchy MUST be clear; users MUST be able to accomplish tasks without instruction.
- Animations and transitions MUST serve purpose — decorative-only motion MUST be avoided.

### III. Minimal Dependencies
Every external dependency MUST be justified before adoption.
- A new dependency MUST NOT be added if native platform APIs or already-present packages cover the need.
- Transitive dependency trees MUST be kept shallow; audit with `npm audit` on every change.
- Prefer battle-tested, actively maintained packages with small bundle footprints.
- Dependencies MUST be pinned to exact versions in `package.json` lock files.

### IV. Accessibility (NON-NEGOTIABLE)
Every rendered element MUST be accessible to all users.
- All non-text content (images, icons, illustrations) MUST have a text alternative (`alt`, `aria-label`, or `title`).
- Text and interactive elements MUST meet a minimum contrast ratio of **4.5:1** (WCAG AA) against their background.
- Interactive elements MUST be keyboard-navigable and MUST have visible focus indicators.
- Semantic HTML elements MUST be preferred over generic `div`/`span` with ARIA roles.
- Screen-reader-only text MUST use the `sr-only` Tailwind utility where visual label is absent.

### V. Error Handling (NON-NEGOTIABLE)
Every operation that can fail MUST have explicit, user-facing error handling.
- All async operations (API calls, data fetching, form submissions) MUST be wrapped in try/catch or use React error boundaries.
- Errors MUST surface a clear, actionable message to the user — never a raw stack trace.
- Loading, empty, and error states MUST be designed and implemented for every data-dependent UI.
- Server-side errors MUST be logged with sufficient context for diagnosis without exposing sensitive data to clients.
- Next.js `error.tsx` and `not-found.tsx` boundary files MUST be present at every route segment that fetches data.

### VI. Architecture Decision Records
Every significant technical choice MUST be recorded before implementation begins.
- During the `/speckit.plan` phase, any significant technical decision (e.g., introducing a new framework,
  database, API pattern, or third-party service) MUST produce an `adr-XXXX.md` file in `docs/adrs/`
  using the standard **MADR** (Markdown Architecture Decision Record) format.
- The ADR MUST be created before `tasks.md` is generated — it is a gate on the `/speckit.tasks` command.
- ADR filenames MUST be zero-padded four-digit sequential integers (e.g., `adr-0001.md`, `adr-0002.md`).
- Each ADR MUST include at minimum: **Title**, **Status**, **Context**, **Decision**, **Consequences**.
- ADRs are immutable once status is `Accepted`; superseding decisions MUST create a new ADR and
  set the prior ADR's status to `Superseded by adr-XXXX`.

## Technology Stack

This project MUST use the following stack. Deviations require an amendment to this constitution.

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Server and client components; file-based routing |
| UI Library | React 18+ | Hooks-first; no class components |
| Styling | Tailwind CSS | Utility-first; no inline styles |
| Components | shadcn/ui | Radix-based primitives; copy-into-repo pattern |
| Language | TypeScript | Strict mode enabled; no `any` without justification |

No additional UI frameworks (e.g., Material UI, Chakra, Ant Design) MUST be introduced alongside shadcn/ui.

## Accessibility Standards

Minimum compliance target: **WCAG 2.1 Level AA**.

- Contrast ratio for normal text: **≥ 4.5:1**
- Contrast ratio for large text (18pt / 14pt bold): **≥ 3:1**
- All form inputs MUST have associated `<label>` elements.
- Focus order MUST follow a logical DOM sequence.
- Dynamic content changes MUST announce via `aria-live` regions where appropriate.
- Accessibility MUST be validated in CI using automated tooling (e.g., axe-core) and supplemented by manual keyboard testing.

## Governance

This constitution supersedes all informal conventions and individual preferences.

- **Amendments** require a documented rationale, an incremented version number per semantic versioning rules, and a propagation review across all templates.
- **MAJOR** bump: Removal or redefinition of a non-negotiable principle.
- **MINOR** bump: New principle, new mandatory section, or material stack change.
- **PATCH** bump: Wording clarification, typo fix, non-semantic refinement.
- All pull requests MUST include a Constitution Check confirming no principle is violated.
- Complexity MUST be justified in PR description; unexplained complexity is grounds for rejection.
- Ratified principles are binding from the moment they appear in this file at version ≥ 1.0.0.

**Version**: 1.1.0 | **Ratified**: 2026-05-14 | **Last Amended**: 2026-05-14
