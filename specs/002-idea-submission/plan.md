# Implementation Plan: Idea Submission System

**Branch**: `002-idea-submission` | **Date**: 2026-05-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-idea-submission/spec.md`

## Summary

Implement an idea submission system for InnovatEPAM allowing authenticated users to submit innovation ideas (title 3–255 chars, description 10–5000 chars, category, optional file attachment ≤ 5 MB), browse all ideas via an expandable listing, and manage their own submissions (edit/delete with confirmation dialog). Admin users can delete any idea after confirmation. Files are stored as SQLite BLOBs for atomic save/rollback. All user-generated content is rendered via React JSX interpolation only — `dangerouslySetInnerHTML` is prohibited (FR-021). Implemented with Next.js 15 App Router Server Actions, Drizzle ORM, Zod validation, react-hook-form, and shadcn/ui (Collapsible + AlertDialog) — no new external dependencies.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)

**Primary Dependencies**: Next.js 15 (App Router), React 19, Drizzle ORM 0.45, Zod 4, react-hook-form 7, shadcn/ui (Collapsible, AlertDialog), iron-session 8

**Storage**: SQLite via better-sqlite3 + Drizzle ORM; file attachments stored as BLOB column in `ideas` table (ADR-0005)

**Testing**: Vitest + React Testing Library (unit/component); Playwright (E2E); integration tests against real SQLite test DB

**Target Platform**: Next.js web application (Node.js server; browser client)

**Project Type**: Web application (full-stack Next.js)

**Performance Goals**: Idea listing loads in < 2 s; form submission completes in < 2 s (SC-001, SC-002)

**Constraints**: No new external dependencies without justification; WCAG 2.1 AA accessibility; TypeScript strict mode; Tailwind-only styling

**Scale/Scope**: Small internal team (< 100 users); v1 with no pagination; single SQLite DB file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Clean Code** — Server actions are single-purpose; components are named by intent; no dead code planned.
- [x] **II. Simple UI/UX** — Tailwind-only; shadcn/ui Collapsible for expandable rows; shadcn/ui AlertDialog for delete confirmation (FR-020); mobile-first layout planned.
- [x] **III. Minimal Dependencies** — No new external dependencies. shadcn/ui Collapsible and AlertDialog use `@radix-ui` primitives managed by shadcn's copy-into-repo pattern.
- [x] **III.a Documentation Freshness** — Next.js 15 Server Action FormData file upload pattern verified against project version. Drizzle blob column type confirmed present in `drizzle-orm/sqlite-core` (current dep).
- [x] **IV. Accessibility** — Collapsible has `aria-expanded`; AlertDialog is keyboard-accessible and focus-trapped; form inputs will have `<label>` associations; file input will have accessible description; `dangerouslySetInnerHTML` prohibited for idea content (FR-021); contrast enforced via shadcn theme.
- [x] **V. Error Handling** — All 5 server actions have explicit try/catch + `{ ok: false, error }` returns; API route returns structured HTTP errors; loading/empty/error states designed for listing and forms.
- [x] **VI. ADRs** — ADR-0005 (attachment storage: SQLite BLOB) created before tasks.md generation. No other new significant architectural decisions.
- [x] **VII. TypeScript Strict Mode** — `"strict": true` already in tsconfig.json; all new code will use typed Drizzle inferred types; no `any`; `===` throughout.
- [x] **Testing** — Vitest + RTL for unit/component; integration tests in `tests/integration/ideas/`; Playwright E2E for 3 critical journeys; CI gates confirmed.
- [x] **Stack** — Next.js 15 App Router + React 19 + Tailwind CSS 4 + shadcn/ui + TypeScript strict.
- [x] **Workflow Governance** — Task-scoped commits planned; PR-before-merge gate to `main` required.

**Violations requiring justification**: None.

## Project Structure

### Documentation (this feature)

```text
specs/002-idea-submission/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── server-actions.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
actions/
└── ideas.ts             # Server Actions: getIdeas, getIdeaDetail, submit, update, delete

app/
├── (protected)/
│   └── ideas/
│       ├── page.tsx           # Idea listing (expandable rows)
│       ├── new/
│       │   └── page.tsx       # Submit idea form
│       └── [id]/
│           └── edit/
│               └── page.tsx   # Edit idea form (submitter only)
└── api/
    └── ideas/
        └── [id]/
            └── attachment/
                └── route.ts   # Authenticated file download

components/
└── ideas/
    ├── IdeaForm.tsx            # Shared form (submit + edit)
    ├── IdeaForm.test.tsx
    ├── IdeaList.tsx            # List container + empty state
    ├── IdeaRow.tsx             # Collapsible row
    └── IdeaRow.test.tsx
    ├── DeleteIdeaButton.tsx    # AlertDialog confirmation + delete action (FR-020)
    └── DeleteIdeaButton.test.tsx

lib/
└── ideas/
    └── validation.ts           # Zod schemas: submitIdeaSchema, updateIdeaSchema

lib/db/
├── schema.ts                   # ADD: ideas table + IDEA_CATEGORIES
├── migrations/
│   └── 0001_add_ideas_table.sql

docs/adrs/
└── adr-0005-idea-attachment-storage.md

tests/
├── integration/
│   └── ideas/
│       ├── submit.test.ts
│       ├── update.test.ts
│       ├── delete.test.ts
│       └── list.test.ts
└── e2e/
    ├── idea-submission-flow.spec.ts
    ├── idea-listing-flow.spec.ts
    └── idea-edit-delete-flow.spec.ts
```

**Structure Decision**: Single Next.js project (Option 1) — extends the existing repository root layout established in feature 001.

## Complexity Tracking

No constitution violations requiring justification.
