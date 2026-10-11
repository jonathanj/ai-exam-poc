# 001 — Foundation

## Intention and goal

Provide a persistent, private examiner workspace on a single Node server.

## Scope and decisions

Next.js App Router, TypeScript, Tailwind and shadcn dashboard-01 patterns. SQLite via Prisma. Provisioned credentials, scrypt password hashes, hashed opaque revocable database sessions, same-origin mutations, per-exam ownership. No public signup. pnpm lockfile. Avoid external font dependencies. Use environment-configured database path on persistent storage.

## Implementation

Scaffold runtime and UI primitives; define migrations; build sign-in and session helpers; provision accounts with CLI; build responsive application shell. Record later increments before coding them.

## Acceptance

Production build; database migration; valid/invalid login and logout; unauthenticated and cross-account access rejected; credentials never exposed to browser.

## Outcome

Implemented Next.js 16.4, React 19.3, Prisma 7.10 with SQLite migrations, provisioned accounts, scrypt hashes, opaque database sessions, origin checks and private ownership boundaries. The shell follows shadcn dashboard-01's SidebarProvider/SidebarInset structure with copied shadcn primitives and a custom examiner navigation.

## Validation

Production build, typecheck and lint pass. Browser tests verify login, logout, unauthorised/cross-account requests, and private print routes. Account creation, sample seed and session revocation CLIs ran successfully against an isolated database.

## Deviations and limitations

Pinned Prisma 7.10 instead of the registry's latest release candidate; TypeScript 6 and ESLint 9 match the installed Next lint ecosystem's peer ranges. Patched shadcn's random skeleton width and mobile hook to comply with current React lint rules. Migration configuration creates the SQLite file before migration because this engine rejected a nonexistent file. No external fonts. HTTPS is required for production cookies. Login throttling is in-memory and single-instance. The supplied directory had no Git repository; no commit references are available, and pnpm-lock.yaml is included for source control.
