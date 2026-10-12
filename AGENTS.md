# Repository guidance

## Start here

Read these before making changes:

1. [Product context](docs/product-context.md) — current scope, assessment rules and product limits. Preserve these requirements unless the task explicitly changes them.
2. [README](README.md) — setup, runtime, AI configuration, verification and operations.
3. [Implementation history](docs/implementation/README.md) — chronological decisions, shipped outcomes and known limitations. Read the records relevant to the task before choosing an approach.

Use these records to find the governing decisions:

| Area                                              | Guiding record                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| Authentication, persistence and application shell | [001 — Foundation](docs/implementation/001-foundation.md)           |
| Exam model, editing and distribution calculations | [002 — Authoring](docs/implementation/002-authoring.md)             |
| Generation, conversations and proposed revisions  | [003 — AI](docs/implementation/003-ai.md)                           |
| Review, printing and delivery                     | [004 — Delivery](docs/implementation/004-delivery.md)               |
| Runtime and native SQLite compatibility           | [005 — Runtime pinning](docs/implementation/005-runtime-pinning.md) |
| Inference protocol configuration                  | [006 — API protocol](docs/implementation/006-api-protocol.md)       |
| Lint and formatting policy                        | [007 — Ox tooling](docs/implementation/007-ox-tooling.md)           |

## Privacy and teacher control

- Authenticate every server read, write, AI operation and print request; enforce the exam's `ownerId` on the server. Client visibility is not an access-control boundary.
- Keep credentials and provider configuration server-only. Never expose secrets in client code or logs.
- Validate structured AI output against the domain schema and operation constraints before persisting it. Keep fixture mode explicit; never silently fall back to sample content.
- AI chat and analysis are advisory. Applying a proposed revision requires explicit teacher acceptance and a check that its source revision is still current.
- Preserve stale-write protection and review invalidation when changing authoring flows.

## UI components and consistency

- Use shadcn/ui for interactive controls and shared UI patterns whenever a suitable component is available. Inspect [src/components/ui](src/components/ui) and nearby usages first; reuse the existing primitives through `@/components/ui/*`.
- If a suitable component is missing locally, add the shadcn/ui component using [components.json](components.json) before building a custom equivalent. Availability in shadcn/ui matters even when the component has not yet been installed here.
- Do not replace available primitives with styled native controls or hand-built equivalents, such as raw `<select>`, `<button>`, `<input>` or `<textarea>` controls. Semantic HTML remains appropriate for document structure and print content.
- Compose domain-specific UI from these primitives. Use the existing theme tokens in [globals.css](src/app/globals.css), shared variants and `cn` utility; preserve accessible labels, focus behavior and keyboard interaction.
- Use a custom control only when the available shadcn components cannot meet a concrete interaction or accessibility requirement. Record the gap and rationale in the applicable implementation record. When changing an existing control, bring it into line with this rule within the task's scope.

## Planning and documentation

Before significant implementation, create a numbered record in [docs/implementation](docs/implementation/README.md) containing:

- Intention, goal and scope.
- Decisions and rationale.
- Implementation steps and acceptance checks.

Afterward, record outcomes, validation, deviations, limitations and commit references when available. Update the chronological index. Refinements update their existing record; architecture or scope changes get a new one. Keep product context and operational documentation aligned with changes to their requirements.

## Tooling and validation

- Use pnpm and the runtime pins in [mise.toml](mise.toml). Follow the README's runtime guidance for native SQLite compatibility.
- For significant changes, run `pnpm check`, `pnpm typecheck` (tsc), `pnpm test` and `pnpm build`. `check` verifies lint and formatting; use `pnpm format` to apply formatting.
- For changes to user flows, access boundaries or print output, run the relevant browser checks described in the README. Keep test data isolated from real exams.
- For documentation-only changes, check formatting, linked paths and the final diff. Record any failed or blocked validation accurately.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
