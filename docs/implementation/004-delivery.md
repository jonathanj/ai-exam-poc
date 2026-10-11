# 004 — Review, printing and delivery

## Intention and goal

Make the paper usable outside the editor and verify the entire authoring workflow.

## Scope and decisions

Human-reviewed status is invalidated by content/blueprint/order changes. Authenticated standalone print routes exclude workspace chrome; separate learner/memo content. Browser print CSS uses A4, answer lines, break avoidance and page counters. Printed unreviewed papers show a draft label. Tests use a distinct SQLite database and explicit fixture AI, never live credentials. Operations target persistent single-instance Node hosting, HTTPS and database backups.

## Implementation

Print views, sample seed, setup and deployment guide; unit and API/browser integration tests; production build and visual checks; record actual validation and remaining limits.

## Acceptance

Full examiner journey; no solutions leak into learner paper; account isolation for print and APIs; sensible responsive layout and print pagination; lint/typecheck/tests/build. Live model smoke test is conditional on supplied credentials.

## Outcome

Implemented examiner review confirmation, authenticated standalone learner/memo views, A4 browser printing with answer space and margin-box page numbers, explicit sample labels, sample seed and operational README. Included a persistent-volume Dockerfile. Repository guidance and numbered implementation records preserve the path of decisions.

## Validation

Final pnpm typecheck, lint, test and production build pass. 15 unit tests and two end-to-end browser suites pass. Browser suites cover authoring, AI refinement, duplication/archive, account boundaries, stale writes/proposals, concurrency, printing and mobile layout, with no browser console errors. Generated a real browser PDF and inspected its rendered first page: A4 spacing, answer lines, question marks and Page 1 footer are correct; multi-page output confirmed. The learner view contains no model-answer sections. Sample seed and session revocation CLIs pass.

## Deviations and limitations

Browser PDF/print is used rather than a dedicated document exporter. Very long subparts may span pages; margin-box page counters require modern Chromium. Dockerfile is provided but the image has not been built or deployed. No hosting destination or live credentials were provided. Login/session controls are suitable for a private single-instance POC; production product requirements (account recovery, immutable audits, calibrated question difficulty and formal curriculum grounding) need subsequent implementation records. Grading remains deferred as agreed.
