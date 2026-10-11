# Exam Studio

A private Grade 7 Mathematics exam-authoring POC built with Next.js, shadcn/ui, Prisma/SQLite, and Vercel AI SDK. Examiners generate from a teacher-defined brief, edit and reorder questions, discuss them with AI, accept proposed revisions, review balance, and print a learner paper or teacher memorandum.

## Run locally

The project pins Node 24.11.1 and pnpm 10.9.0 in `mise.toml`. Use the same Node runtime for installing dependencies and running the app because SQLite uses a native module. The lockfile pins dependency versions.

```sh
mise trust
mise install
mise exec -- pnpm install --frozen-lockfile
cp .env.example .env
mise exec -- pnpm db:generate
mise exec -- pnpm db:migrate
```

Provision an account. Pass the password through an environment variable instead of putting it in command history (minimum 12 characters):

```sh
printf 'New account password: '
read -r -s ACCOUNT_PASSWORD
export ACCOUNT_PASSWORD
mise exec -- pnpm account:create examiner@example.com 'Examiner Name'
unset ACCOUNT_PASSWORD
mise exec -- pnpm dev
```

Open http://localhost:3000 and sign in. In development, the browser URL must match `APP_URL`; set it to `http://127.0.0.1:3000` if you use that hostname instead. Mutating requests verify the origin.

### Recover from a native SQLite version mismatch

If better-sqlite3 reports different `NODE_MODULE_VERSION` values, it was compiled with a different Node major from the one running the command. Switching versions alone does not rebuild an existing native binary. From this directory run:

```sh
mise trust
mise install
mise exec -- node --version
mise exec -- pnpm exec node --version
mise exec -- pnpm rebuild better-sqlite3
```

Both version checks should report `v24.11.1`. If a desktop/CI command environment keeps Homebrew ahead of mise on PATH, explicitly prepend the selected tools:

```sh
mise exec -- sh -c 'export PATH="$(mise where node)/bin:$(mise where pnpm):$PATH"; pnpm rebuild better-sqlite3'
```

Use the same PATH wrapper to run pnpm commands in that environment. Retry your account command with `mise exec -- pnpm account:create …`, then restart any existing dev server with the pinned runtime. Rebuild after changing Node versions. These steps preserve the database. If mise is activated in your shell, ordinary `pnpm` commands also use the local pins; `mise exec --` makes the selected runtime explicit.

## Configure AI

Set server-only values in `.env` or the host's secret environment:

- `LLM_BASE_URL`: API base, normally including `/v1`. Do not append `/responses` or `/chat/completions`; the SDK appends the operation path.
- `LLM_API_PROTOCOL`: `chat-completions` (default, compatible provider) or `responses` (OpenAI Responses adapter). Applies to generation, revisions, analysis and streaming question chat.
- `LLM_API_KEY`: bearer API key.
- `LLM_MODEL`: model ID served by the endpoint.
- `LLM_STRUCTURED_OUTPUTS=true` only if the endpoint supports native JSON-schema output. Otherwise the application requests JSON as text and validates it locally.

For the new OpenCode Console gateway, configure `LLM_BASE_URL=https://opencode.ai/inference/openai/v1`, `LLM_API_PROTOCOL=responses`, `LLM_MODEL=gpt-6-luna`, and your service account key as `LLM_API_KEY`. Leave structured outputs disabled until verified against your gateway. Restart the application after changing environment variables.

OpenCode Go documents a separate subscription route: use `LLM_BASE_URL=https://opencode.ai/zen/go/v1` with `LLM_API_PROTOCOL=responses` for GPT-6 Luna. The general Console route above should not be assumed to use Go subscription allowances. All inference calls send a stable hashed exam ID as `x-opencode-session` and identify the app as `exam-studio/0.1.0`. Go is documented for coding-agent traffic; confirm eligibility for exam authoring with the provider. Authentication and subscription access still need live verification.

- `AI_ADAPTER=live` for real requests (default).

Generation, proposed revisions and analysis validate complete results and allow one repair attempt. A paper must match the question count, total marks, and independently rounded mark targets. Each provider request has a 70-second timeout; generation may make two requests. A busy generation lease expires after three minutes if a process crashes. Failures preserve saved questions. Errors and usage are available under **AI history**.

For an offline demonstration, explicitly set `AI_ADAPTER=fixture`, restart, and optionally run:

```sh
pnpm sample:seed examiner@example.com
```

The UI and printouts label fixture-generated papers as sample data. Fixtures test the workflow and distributions; they intentionally repeat simple maths and are not a curriculum-calibrated exam bank. Missing live settings never silently switch to fixtures.

## Authoring model

The saved wizard covers metadata, teacher guidance, topics, calculator policy, marks, duration, question count, and separate difficulty/cognitive-demand percentages. Save or Continue persists a draft. Reopen it through My exams and Brief.

Questions contain optional shared context and assessable parts. Single-part questions display as flat questions; multiple parts display as 1.1, 1.2, etc. Parts own marks, estimated time, concept, difficulty, computation, cognitive demand, answer, explanation, strategies and criteria. Paper totals are derived; rubric totals must match part marks. Reordering uses drag, keyboard (Space → arrow keys → Space), or up/down buttons.

Difficulty and cognitive-demand targets use largest-remainder rounding so each sums to the total marks. Editing is teacher-controlled: the app reports drift rather than rewriting the paper. Body labels (including IEB and GEC) are context, not verified official compliance. The cognitive preset is explicitly a POC preset.

Question chat does not mutate the paper. Proposals show complete before/after content and must be accepted. Stale proposals and stale saves are rejected. Accepted revisions and conversations persist. AI runs retain input snapshots, including previous question revisions, when regeneration replaces the active question set. Manual deletion removes that question's active history; this is not an immutable audit system.

Review is the examiner's approval. Subsequent edits, brief changes and ordering changes return the paper to draft. Whole-paper AI analysis is advisory. Print routes are authenticated and separate solutions from learner content. Browser Save as PDF is the export mechanism; A4 margin-box page numbers require a modern Chromium browser. Turn off browser-added headers/footers. Very long subparts may span pages.

## Verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Browser tests start a fixture server on port 3100 and reset **only `data/e2e.db`**. They provision two test-only accounts, exercise the full workflow, check origin/ownership boundaries and stale/duplicate operations, and save desktop/mobile/print evidence in ignored `test-results/`. Google Chrome is the default test browser. For Playwright Chromium, run `pnpm exec playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`.

The live-provider smoke test remains pending until your endpoint is configured: create a small paper, check maths and target totals, send a question message, accept a revision, run analysis, and inspect AI history. A successful fixture run is not evidence of live-model quality.

## Hosting and operations

Use one long-lived Node instance with a persistent writable volume; local SQLite is not suitable for ephemeral serverless filesystems or multiple independent replicas. No hosting account is configured by this repository.

```sh
pnpm install --frozen-lockfile
pnpm db:generate
pnpm build
# Runtime environment: DATABASE_URL=file:/data/exam-studio.db,
# APP_URL=https://your-demo.example, AI settings, NODE_ENV=production.
pnpm db:migrate
pnpm start
```

Serve HTTPS through the host/reverse proxy. Production cookies are Secure. Configure `APP_URL` to the public HTTPS origin. Give the application permission to write the database directory. Keep the server running for the whole AI request and disable proxy buffering for streaming chat. Account creation, sample seeding and session revocation run with the same environment/database as the server.

A Dockerfile is included. Build with `docker build -t exam-studio .`, then run with a persistent volume mounted at `/data` and runtime environment supplied securely. The container migrates before startup. Provision accounts using `docker exec` and pass `ACCOUNT_PASSWORD` through the execution environment. Never embed credentials in the image.

Revoke all sessions for an account:

```sh
pnpm account:revoke examiner@example.com
```

Password recovery is administrative; public registration and email reset are deferred. Sessions expire after seven days. Login has a single-instance, in-memory failed-attempt limit; restarts reset it. There is no role system, collaboration, or organisation tenancy.

For a consistent backup, stop the app, copy the database file and any `-wal`/`-shm` companions together, then restart. Alternatively use SQLite's `.backup` command while running. Protect backups like the database. Restore with the app stopped, then run migrations before startup. Back up before applying new migrations; do not copy just the main file while writes are in progress. Prompts and implementation records live in source control rather than SQLite.

## Retracing the build

Start at [implementation history](docs/implementation/README.md). The numbered records contains the original intention and decisions plus the shipped outcome, validation, deviations and limits. [AGENTS.md](AGENTS.md) requires the same approach for later significant changes. Prompts are versioned under `src/lib/prompts/v1`.

Deferred: scan uploads, grading/learner analytics, diagrams/images, collaboration, formal curriculum profiles, and dedicated PDF/DOCX exports.
