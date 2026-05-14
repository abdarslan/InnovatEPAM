# ADR-0007: Dynamic Category Field Rules for Idea Submission

## Status
Accepted

## Context

The idea submission workflow currently supports a fixed set of core fields. The feature requires category-dependent additional fields (for example Event Plan asking planned date and planned attendees), extensible over time, and admin-managed without redesigning the base submission flow.

Constraints:

- Existing stack: Next.js, TypeScript strict, Drizzle, SQLite, Zod.
- No new dependency without strong justification.
- Test project allows DB reset; no migration/backfill requirement in v1.
- Rule management must be admin-only.

## Decision

Adopt a dynamic rule/value model with two relational tables:

1. `idea_category_field_rules`
- Stores admin-managed rule metadata per category (`fieldKey`, `label`, `fieldType`, required flag, constraints, order, active status, audit columns).

2. `idea_field_values`
- Stores per-idea submitted key/value pairs, each linked to rule metadata and parent idea.

Validation strategy:

- Keep existing static validation for base fields.
- Add rule-driven validation for dynamic fields at submission/update time.
- Persist dynamic values only for fields applicable to the selected category.

Authorization strategy:

- Only admins can create/update rule definitions.
- Regular users can submit ideas using published active rules.

## Consequences

### Positive

- Extensible category-specific forms without schema redesign for every new field.
- Clear authorization boundary for rule governance.
- Works with existing stack and no new package adoption.
- Aligns with clarified v1 requirement that Event Plan fields are optional.

### Negative

- Additional domain complexity (rule engine + dynamic validation layer).
- Extra joins needed when reading idea details with dynamic values.
- Requires careful testing for category switch behavior and stale field exclusion.

### Neutral

- For this test project v1, no historical migration is performed; DB reset is acceptable when rules evolve.
