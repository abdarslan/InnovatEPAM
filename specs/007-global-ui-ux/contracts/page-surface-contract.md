# Page Surface Contract

## Scope
This contract defines how page-level surfaces should be framed across the app.

## Requirements
- Every page must make the main title, primary content, and supporting actions easy to identify.
- Dense pages must preserve clear hierarchy between content blocks.
- Forms, lists, tables, dialogs, alerts, loading states, empty states, and error states must use the shared page surface rules.
- Responsive layouts must prevent overlap or hidden controls at common viewport sizes.

## Acceptance Rules
- A user should be able to identify the main action area on a representative page without extra instruction.
- Long titles and long labels must wrap or truncate without breaking the layout.
- Loading, empty, and error surfaces must remain structurally consistent with the rest of the app.