# 008 — Repository guidance

## Intention and goal

Make AGENTS.md a concise entry point for lasting engineering decisions, with enough documentation routing for future sessions to start without rediscovering the repository.

## Scope

Restructure AGENTS.md, extract product scope and assessment constraints into a supporting document, strengthen the shadcn/ui rule, and link the guidance from the README and chronological index. Application code and existing UI violations are outside this documentation change.

## Decisions and rationale

- Keep privacy, teacher control, UI conventions, planning and verification in AGENTS.md because they govern work across features.
- Put the initial subject/grade, assessment semantics, compliance limits and deferred features in docs/product-context.md. Link it from AGENTS.md so moving those requirements does not make them optional.
- Require existing shadcn/ui primitives first, then available shadcn components, with custom equivalents justified only by a concrete gap.
- Use a short startup reading order and task-specific links to existing implementation records rather than duplicating their technical detail.
- Preserve the Next.js-managed instruction block verbatim.

## Implementation steps

1. Add supporting product context grounded in the README, domain schema and implementation records.
2. Organize AGENTS.md into startup references, engineering boundaries, UI rules, planning and validation.
3. Update the README and chronological index.
4. Check formatting, local links, preserved requirements and the final diff; record outcomes and limitations.

## Acceptance checks

- AGENTS.md has clear sections and a useful startup reading path.
- Product-specific scope is discoverable in supplementary documentation.
- Ownership enforcement, secret handling, AI validation and explicit revision acceptance remain required.
- shadcn/ui reuse and the criteria for exceptions are explicit.
- Planning and verification requirements remain intact; the generated Next.js block is unchanged.
- All added local Markdown links resolve and documentation formatting passes.

## Outcomes and validation

Restructured AGENTS.md into a startup reading path, a task-to-record reference table, privacy and teacher-control boundaries, UI conventions, planning requirements and validation guidance. Added docs/product-context.md for current scope, assessment semantics, compliance limits and deferred capabilities. Linked the entry points from the README and added this record to the chronological index. Updated the README verification commands to use pnpm check.

The shadcn rule now requires reuse of local primitives or addition of suitable available shadcn components before a custom equivalent. Exceptions require a concrete interaction/accessibility gap and recorded rationale; controls touched by later tasks should be aligned within those tasks' scope.

Applied Oxfmt to the five changed documents. pnpm check passes with the pinned mise runtime. Local Markdown link targets resolve, git diff --check passes, and a comparison against HEAD confirms the Next.js-managed block is unchanged. Reviewed the extracted constraints against the README, domain schema and implementation records.

## Deviations and limitations

Documentation-only change: no application behavior or existing UI controls were modified. Typecheck, unit tests and build were not run because no executable code changed. The initial check passed with an unsupported Node 26 warning; verification was repeated successfully using the repository's pinned runtime. No new skill was created; Skill Creator's instruction-structure and progressive-disclosure principles informed the rewrite.

## Commit reference

Included in `docs: clarify repository guidance and shadcn conventions`; see Git history for the commit hash.
