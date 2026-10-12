# Working in this repository

Before significant implementation, create a numbered plan in docs/implementation/ with intention, goal, scope, decisions/rationale, implementation steps, and acceptance checks. Afterward record outcomes, validation, deviations, limitations, and commit references when available. Update the chronological index. Refinements update their existing record; architecture or scope changes get a new one.

Keep exams private: server reads, writes, AI and print must authenticate and enforce ownerId. Never put secrets in client code or logs. AI output must be validated and revisions accepted explicitly. Difficulty and cognitive demand are independent mark-weighted dimensions. Grade 7 maths is the initial scope; official compliance is not claimed. Use pnpm. Run `pnpm check`, `pnpm typecheck` (tsc), `pnpm test` and `pnpm build` for significant changes. `check` verifies lint and formatting; use `pnpm format` to apply formatting.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
