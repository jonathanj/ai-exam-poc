# 002 — Authoring

## Intention and goal

Create, persist and inspect a teacher-controlled Grade 7 maths paper.

## Scope and decisions

Wizard saves drafts on step navigation. Questions are containers with an introduction and one or more assessable parts (a single part displays as a flat question). Parts own marks and rubric criteria; totals are derived. Largest-remainder rounding produces deterministic mark targets independently for difficulty and cognitive demand. Accessible dnd-kit ordering plus arrow controls. Manual changes and reordering invalidate reviewed status. Explicit save forms report success/failure. Optimistic revision checks prevent overwriting stale editor state.

## Implementation

Shared Zod domain schemas and calculations; ownership-scoped API; wizard; searchable library; question editing and revisions; overview charts, coverage and warnings.

## Acceptance

Reload drafts and exams; correct totals/distributions; manual questions/subparts and rubric validation; reorder and renumber; duplicate/archive; cross-account denial; responsive, keyboard-accessible editor.

## Outcome

Implemented the persistent four-step wizard, searchable private library, duplicate/archive/restore actions, shared manual editor, one-level subparts, rubric validation, ordered numbering, pointer/keyboard drag, arrow controls, independent mark-weighted distribution charts, concept coverage and time/balance warnings. Explicit saves report success or failure. Reviewed status is invalidated by later mutations. Mathematical Markdown uses remark-math and untrusted KaTeX rendering.

## Validation

Unit checks cover integer rounding, total/rubric/count constraints and derived numbering. Browser journey verifies wizard generation, manual addition, reload persistence, keyboard/arrow reordering, duplication, archive and 390px mobile layout without horizontal overflow. Desktop and mobile screenshots inspected.

## Deviations and limitations

Questions use a container plus assessable parts, including one-part flat questions; container totals are derived rather than separately editable. Drafts save on Save/Continue, not every keystroke; reopening the brief starts at the first step with saved values. Charts only mount when visible to avoid hidden-panel measurement warnings. Teacher edits may deliberately deviate from blueprint targets. Diagram questions remain deferred.

## Commit reference

`d619d08` — feat(authoring): add exam creation and editing workflow
