# 005 — Pin the project runtime with mise

## Intention and goal

Prevent native SQLite ABI mismatches between dependency installation and application/CLI execution.

## Scope and decisions

The initial dependencies were built with Homebrew Node 26 (ABI 147), while the user's mise shell selected Node 22 (ABI 127). Pin the already-installed Node 24.11.1 and pnpm 10.9.0 locally in mise.toml. Keep Node 24 as the supported project major and use the same exact version for both Docker stages. Rebuild better-sqlite3 under the selected runtime; do not change or recreate application data. Explicit mise exec avoids relying on the desktop tool shell's PATH activation.

## Implementation

Add project tool pins, align package engines and Docker image, document initial setup and recovery after Node changes, rebuild the native module using mise, and verify Prisma queries and application checks under Node 24.

## Acceptance

mise exec reports Node 24.11.1; native SQLite in-memory query and Prisma user count succeed; typecheck, lint, tests and production build work under the pinned version. No examiner accounts or existing data are modified.

## Outcome

Added mise.toml with Node 24.11.1 and pnpm 10.9.0; aligned package engines and Docker stages. Trusted the local config, installed the pinned pnpm, and rebuilt better-sqlite3 for Node 24 ABI 137. An existing-database Prisma user count query succeeds without modifying accounts or paper data. Typecheck, lint, all 15 unit tests and production build pass under the pinned runtime.

## Environment finding

The Codex command shell kept Homebrew ahead of mise on inherited PATH for subprocesses, even though direct mise-selected node reported 24. Explicitly prepending `mise where node` and `mise where pnpm` during the rebuild and verification resolved this. README now checks both direct Node and pnpm's subprocess Node, and documents this fallback. A user's normally activated mise shell can use ordinary project-local commands. Existing running dev servers must restart to use the rebuilt module.
