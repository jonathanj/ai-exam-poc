# Product context

This document defines the current product scope and assessment constraints. Read it alongside [repository guidance](../AGENTS.md). The [README](../README.md) describes setup and current behavior; [implementation history](implementation/README.md) records the decisions and their validation.

## Current scope

Exam Studio is a private, teacher-controlled exam-authoring proof of concept. Grade 7 Mathematics is the initial supported scope and is enforced by the current brief schema. Broadening subjects or grades requires an explicit scope decision and a new implementation record.

The workflow covers a saved teacher brief, manual and AI-assisted question authoring, proposed revisions, balance review, and separate learner-paper and teacher-memorandum print views. Accounts are administratively provisioned; collaboration, roles and organisation tenancy are not implemented.

## Assessment model

- Difficulty and cognitive demand are independent, mark-weighted dimensions. Never infer one from the other or use question counts as their weighting.
- Round each dimension's percentage targets independently using largest-remainder rounding so each totals the paper's marks.
- Questions contain optional shared context and one or more assessable parts. Parts own marks and rubric criteria; question and paper totals are derived. Rubric marks must equal their part's marks.
- Generated papers must satisfy the requested question count, total marks and independently rounded targets. Manual teacher edits may depart from those targets; report drift rather than silently rewriting content.
- Teacher review approves the paper. Later content, brief or ordering changes return it to draft.
- Learner printouts must exclude answers and teacher-only solution content. Unreviewed papers and fixture-generated sample content must remain clearly labelled.

The executable schemas and calculations are in [src/lib/domain.ts](../src/lib/domain.ts). The rationale is recorded in [002 — Authoring](implementation/002-authoring.md), [003 — AI](implementation/003-ai.md) and [004 — Delivery](implementation/004-delivery.md).

## Claims and quality limits

Curriculum/body labels, including IEB and GEC, provide context; the application does not claim verified official compliance. The cognitive-demand preset is a POC preset, not an official specification.

Fixtures demonstrate workflows and distribution calculations. They are not a curriculum-calibrated question bank, and successful fixture tests do not establish live-provider interoperability or mathematical quality. AI analysis remains advisory and teacher review remains necessary.

## Deferred capabilities

Scan uploads, grading and learner analytics, diagrams/images, collaboration, formal curriculum profiles, and dedicated PDF/DOCX export remain deferred. Browser printing is the current export mechanism.

See the README and implementation records for operational limits, validation evidence and any later changes to this scope.
