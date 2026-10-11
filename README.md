# Exam Studio

Private Grade 7 maths authoring POC. Implementation milestones are indexed under docs/implementation.

## Local setup

Use Node 24 and pnpm 10.9.0. Run pnpm install --frozen-lockfile, copy .env.example to .env, run pnpm db:generate and pnpm db:migrate. Provision an account with ACCOUNT_PASSWORD in the environment and pnpm account:create email "Name". Start with pnpm dev. Browser origin must match APP_URL.

Passwords require at least 12 characters. Keep credentials and SQLite files out of Git.
