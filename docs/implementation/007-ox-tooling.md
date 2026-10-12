# 007 — Oxlint and Oxfmt tooling

## Intention and goal

Replace ESLint and Prettier with standalone Oxlint and Oxfmt, preserving applicable Next.js checks and the selected local style rules. Make lint and formatting checks part of agent verification.

## Scope and decisions

Use explicit native rules mapped from the installed Next.js core-web-vitals and TypeScript presets, retaining their severities and options. Add function-component, hooks, dependency-array, JSX braces/booleans/keys, type-import and inline-comment policies. Keep configuration self-contained with no JavaScript plugins. Unsupported checks are relative location navigation, React deprecated APIs and compiler config/gating; compiler checks that are available natively remain experimental. JSX usage bookkeeping is handled natively. Preserve formatter preferences and generated-file exclusions.

## Implementation steps

1. Map supported rules into the local Oxlint config, translating TypeScript extension rules to native equivalents.
2. Remove ESLint configuration and obsolete dependencies; route lint commands through Oxlint.
3. Apply safe lint fixes and formatting, resolving remaining diagnostics without changing application behavior.
4. Run check, typecheck, tests and production build.

## Acceptance checks

Only Oxlint and Oxfmt provide lint and formatting commands. All eight selected rules retain their requested options. No external rule inventory remains in project files. Lint, formatting, tsc, tests and a production build pass, or concrete limitations are recorded.

## Outcomes and validation

Installed Oxlint 1.87.0 and Oxfmt 0.72.0. Removed ESLint, eslint-config-next, Prettier and the ESLint config. The lint alias now delegates to check:lint; check combines lint and formatting verification. AGENTS.md requires check, tsc, tests and production build.

The self-contained config explicitly enables supported Next.js, React, accessibility, import and TypeScript checks plus all eight selected rules. Category defaults are disabled to keep the policy explicit. Generated outputs are excluded while project configuration files are now linted. JSX boolean value keeps the `value` exception; unnecessary JSX braces are prohibited in props and children. Applied safe type-only import fixes and repository-wide Oxfmt formatting, so the formatting baseline is clean.

Validation under Node 24.11.1: check and typecheck pass; all 23 unit tests pass. A temporary external probe confirmed inline comments fail lint with a nonzero exit status. The standard Turbopack build hits the sandbox CSS-worker port-binding restriction; the webpack production build passes.
