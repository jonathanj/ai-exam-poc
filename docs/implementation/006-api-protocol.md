# 006 — Configurable inference protocol

## Intention and goal

Allow Responses-only gateways such as OpenCode Console to generate papers and stream question conversations without changing application code for each provider.

## Scope and decisions

Add LLM_API_PROTOCOL=chat-completions|responses, defaulting to chat-completions for compatibility. Keep structured-output capability independent. Use the official AI SDK OpenAI adapter for Responses and retain the compatible adapter for chat. Require a base URL without an operation suffix and report invalid configuration before inference. Never log credentials or provider response bodies.

## Implementation steps

Add the compatible stable OpenAI SDK dependency, centralise model creation and configuration validation, update setup examples, and exercise both adapters with mocked HTTP responses.

## Acceptance checks

Verify exact request paths and schema payloads for both protocols, invalid configuration errors, existing generation and interruption behavior, typecheck, lint, unit tests, and production build. Live credentials are not required for mocked validation; endpoint success remains unverified until a live smoke test.

## Outcomes and validation

Session-routing refinement plan: resolve OpenCode Go MissingSessionID by sending a stable x-opencode-session derived from the authorised exam ID on every inference operation, including repair and chat calls. Hash the ID to avoid exposing internal database identifiers, and identify the client honestly as exam-studio/0.1.0. Verify stable/distinct session IDs and transport headers for both adapters. Correct the README to distinguish the Go subscription route from general Console inference; no subscription eligibility or live success is assumed.

Session-routing outcome: every AI call now receives the server-authorised exam ID and sends its stable SHA-256 session identifier with both adapters. A fetch wrapper preserves the app user agent after SDK header merging; HTTP-mocked tests caught and verified that behavior. Typecheck, lint, all 23 unit tests, and the webpack production build pass. Live retry is still required to confirm the provider accepts the complete request.

Diagnostic refinement: enable Next.js development fetch logging with fullUrl in next.config.ts to inspect the inference request URL, status and duration when generation returns 502. This uses built-in development logging without adding header or body dumps.

Further diagnostic refinement: after the Go route returned HTTP 400, log selected JSON provider error fields (status, code, type and bounded message) in development only. Redact the configured API key and recognizable bearer/key tokens, omit non-JSON responses, and never dump SDK error objects, request bodies or headers. Verify logging redaction and production suppression. HTTP 400 alone does not establish the cause; wait for the provider validation message before changing the request.

Added @ai-sdk/openai 4.0.91 and a shared model factory, selected explicitly through LLM_API_PROTOCOL. Existing chat behavior remains the default. Both generation and conversation use the factory; generation validates configuration before its endpoint error wrapper so setup errors remain actionable. Full operation URLs, invalid protocols, and malformed base URLs now report configuration errors. Updated the environment template and README without modifying local credentials.

Typecheck, lint and all 20 unit tests pass. New HTTP-mocked tests verify real SDK request paths and native schema payloads for both protocols. The webpack production build passes. Default Turbopack build failed because its CSS worker could not bind a local port (Operation not permitted), including a retry with requested escalation; this is an execution-environment limitation. No live inference was performed, so gateway access and structured-output forwarding remain unverified. The directory initially had no Git repository; commit references are now recorded below.

## Commit reference

`72b854b` — feat(ai): support configurable inference protocols
