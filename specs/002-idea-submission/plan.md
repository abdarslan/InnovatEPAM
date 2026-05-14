# Implementation Plan: Idea Submission System (Multi-Attachment + Preview)

**Branch**: `002-idea-submission` | **Date**: 2026-05-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-idea-submission/spec.md`

## Summary

Evolve the existing idea submission capability from single-file attachment storage to a bounded multi-attachment model (up to 5 files, 10 MB each, 25 MB total) with authenticated multimedia preview and download in both submission and listing flows. Keep owner edit/delete permissions unchanged, including post-submission attachment add/remove operations, while preserving transactional integrity for idea and attachment persistence.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)

**Primary Dependencies**: Next.js 15 App Router, React 19, Drizzle ORM 0.45, Zod 4, react-hook-form 7, iron-session 8, Tailwind 4, shadcn/ui

**Storage**: SQLite (better-sqlite3 + Drizzle); normalize attachments into a dedicated table linked to ideas

**Testing**: Vitest + React Testing Library (unit/component), integration tests under `tests/integration/ideas`, Playwright E2E under `tests/e2e`

**Target Platform**: Next.js web app (Node.js server + browser clients)

**Project Type**: Single full-stack web application

**Performance Goals**:
- Listing render (metadata only) under 2 s for normal workspace-scale datasets
- Attachment preview initial response under 1 s for small files under normal local/dev conditions
- Submission remains within the spec target of under 2 minutes user completion time

**Constraints**:
- No new npm dependencies unless justified and documented
- Max 5 attachments per idea
- Max 10 MB per attachment, 25 MB aggregate per submission/edit operation
- Allowed MIME families: document/image/audio/video as specified in the feature spec
- All attachment preview/download surfaces require authentication

**Scale/Scope**:
- Single project deployment
- Low to moderate concurrent authenticated usage
- No pagination redesign in this feature (existing listing behavior retained)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Gate (pre-research)

- [x] **I. Clean Code** — Extend existing idea modules (`actions/ideas.ts`, `lib/ideas/validation.ts`, `components/ideas/*`) with cohesive attachment helpers; avoid duplicated attachment parsing logic.
- [x] **II. Simple UI/UX** — Keep current form/listing UX; add attachment picker, previews, and remove controls without introducing new navigation complexity.
- [x] **III. Minimal Dependencies** — Planned implementation uses existing stack only; no dependency additions required.
- [x] **III.a Documentation Freshness** — Context7 verification was attempted for Next.js and Drizzle APIs; the environment is currently blocked by authentication failure (`ctx7sk` key unavailable), so this plan proceeds with an explicit pre-implementation follow-up verification task.
- [x] **IV. Accessibility** — Preview elements require keyboard access, text alternatives, and robust error messaging for unsupported preview types.
- [x] **V. Error Handling** — Submission/edit and attachment API flows will return explicit actionable errors; loading/empty/error states remain required in listing/details.
- [x] **VI. ADRs** — Existing `docs/adrs/adr-0005-idea-attachment-storage.md` remains relevant; if schema normalization implications materially change the prior decision, add a superseding ADR before `/speckit.tasks`.
- [x] **VII. TypeScript Strict Mode** — Keep strict typing across attachment DTOs and action contracts.
- [x] **Testing** — Existing test harness (Vitest/RTL, integration, Playwright) supports required coverage expansion.
- [x] **Stack** — No deviation from mandated stack.
- [x] **Workflow Governance** — Plan remains compatible with task-scoped commits and PR-before-merge rule.

### Re-check (post-design)

- [x] Research decisions resolve all technical unknowns for multi-attachment preview behavior.
- [x] Data model and contracts reflect bounded multi-file requirements and auth constraints.
- [x] Phase 1 artifacts are complete (`research.md`, `data-model.md`, `contracts/server-actions.md`, `quickstart.md`).
- [x] Agent context already references `specs/002-idea-submission/plan.md` between SPECKIT markers; no pointer change required.

## Project Structure

### Documentation (this feature)

```text
specs/002-idea-submission/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── server-actions.md
└── tasks.md
```

### Source Code (repository root)

```text
actions/
└── ideas.ts                          # MODIFY: multi-attachment create/update/list/detail logic

app/
└── api/
  └── ideas/
    └── [id]/
      ├── attachment/
      │   └── route.ts               # MODIFY or deprecate in favor of attachment-id route
      └── attachments/
        └── [attachmentId]/
          └── route.ts               # NEW: authenticated preview/download endpoint per attachment

components/
└── ideas/
  ├── IdeaForm.tsx                   # MODIFY: multiple file selection, preview, per-file removal
  ├── IdeaRow.tsx                    # MODIFY: multi-attachment preview/download rendering
  ├── IdeaList.tsx                   # MODIFY: attachment count metadata display (if needed)
  └── *.test.tsx                     # MODIFY: form/row behavior tests for multi-attachment paths

lib/
├── db/
│   ├── schema.ts                    # MODIFY: normalize attachment table and relationships
│   ├── migrations/
│   │   └── 0002_ideas_multi_attachments.sql  # NEW: schema migration
│   └── seed.ts                      # MODIFY: optional fixture ideas with multiple attachments
└── ideas/
  └── validation.ts                  # MODIFY: array/aggregate limits and MIME validation

tests/
├── integration/
│   └── ideas/
│     ├── submit.test.ts             # MODIFY: multi-file acceptance and rollback checks
│     ├── update.test.ts             # MODIFY: add/remove attachment behavior after submission
│     ├── list.test.ts               # MODIFY: attachment summary and detail payload shape
│     ├── attachment.test.ts         # MODIFY: per-attachment auth + response semantics
│     └── delete.test.ts             # VERIFY: delete cascade behavior for related attachments
└── e2e/
  └── ideas-multimedia-flow.spec.ts  # NEW: submit, preview, edit attachment lifecycle
```

**Structure Decision**: Keep the existing single-project Next.js architecture and evolve only current idea-related modules. Introduce one normalized attachment table and one per-attachment API route to support previews/downloads without cross-cutting architectural changes.

## Complexity Tracking

No constitution violations requiring waiver. The only outstanding governance item is a documented Context7 freshness follow-up due tooling authentication failure in this environment.
