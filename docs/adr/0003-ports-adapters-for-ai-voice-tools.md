# ADR 0003: Isolate AI, voice and tools behind narrow adapters

- Status: Accepted
- Date: 2026-09-24

## Context

JEV, LLM and voice providers are evolving quickly. The POC may test OpenAI, Gemini, Grok or other providers and may later run on different cloud platforms.

## Decision

Core orchestration depends on small application-owned interfaces rather than provider SDK types.

Initial ports:

- `DecisionEngine`
- `LanguageModel`
- `ToolExecutor`
- `SessionStore`
- `TraceSink`

Voice is added later as an input adapter producing normalized transcript events.

## Consequences

- provider experiments do not rewrite domain code,
- tests can use fakes,
- cloud migration is easier,
- the project must resist turning these ports into a generic provider framework.
