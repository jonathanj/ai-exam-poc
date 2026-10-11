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

Responses and Chat Completions adapters are explicitly selectable. Base URL configuration errors are actionable. HTTP-mocked tests validate paths and native schema payloads; live provider validation continues in the following fix.
