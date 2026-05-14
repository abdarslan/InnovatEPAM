# Research: Smart Idea Submission Forms

**Feature**: `004-smart-idea-submission`
**Date**: 2026-05-14

## Decision 1: Store category field rules and values in dedicated relational tables

- Decision: Use two new tables: `idea_category_field_rules` for admin-managed field metadata and `idea_field_values` for per-idea submitted key/value data.
- Rationale: Keeps dynamic behavior extensible without code/schema redesign for every category field change, while preserving strong validation and reviewer visibility.
- Alternatives considered:
  - Store dynamic values as JSON on `ideas`: rejected because per-field validation and selective querying become harder over time.
  - Hardcode fields in TypeScript only: rejected because FR-016 requires configurable rules and admin-managed updates.

## Decision 2: Keep base idea schema unchanged and layer dynamic validation on top

- Decision: Continue validating core fields with existing `submitIdeaSchema` and add a dynamic validation layer based on selected category rules.
- Rationale: Minimizes regression risk in existing submission flow while adding category-specific constraints.
- Alternatives considered:
  - Replace all validation with one fully dynamic schema: rejected due to higher complexity and weaker type guarantees for existing core fields.

## Decision 3: Represent dynamic field values as typed strings with rule-driven coercion

- Decision: Persist submitted field values as strings in `idea_field_values.value`, then parse/validate by `fieldType` (`text`, `number`, `date`) in validation logic.
- Rationale: SQLite simplicity, straightforward form wiring, and enough flexibility for v1 optional Event Plan fields.
- Alternatives considered:
  - Separate typed columns for each value kind: rejected as overly rigid and migration-heavy for evolving rules.
  - Raw JSON blobs per value: rejected for weaker per-field constraints.

## Decision 4: Introduce admin-only rule management surface

- Decision: Provide admin-only operations to create/update category field rules and deny non-admins server-side.
- Rationale: Satisfies FR-019 while keeping governance aligned with existing admin authorization model.
- Alternatives considered:
  - Developer-only seed/config updates: rejected because FR-019 explicitly requires admin-managed updates.
  - Allow all authenticated users to modify rules: rejected due to governance and data quality risk.

## Decision 5: No historical migration in v1 test project

- Decision: Treat v1 as reset-friendly: no migration/backfill is required; database cleaning/reset is acceptable.
- Rationale: Explicitly clarified by user and reduces delivery overhead for this test-only environment.
- Alternatives considered:
  - Backfill existing submissions to new format: rejected as unnecessary for current environment.
  - Runtime compatibility adapters for old/new records: rejected because there is no legacy production dataset.

## Decision 6: No new npm dependencies

- Decision: Implement dynamic rules and validation using current stack (Next.js, Drizzle, Zod, react-hook-form).
- Rationale: Meets Constitution Principle III (Minimal Dependencies) and keeps maintenance cost low.
- Alternatives considered:
  - Add form-builder libraries: rejected due to extra dependency surface and no strong need for v1 scope.
