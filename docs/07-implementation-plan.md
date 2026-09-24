# Implementation plan

Build in thin vertical slices. Stop after each milestone and prove it works.

## Milestone 1 — walking skeleton

Outcome: type text into the UI and see a traced deterministic response.

Build:

- workspace,
- React UI,
- Fastify API,
- SQLite store,
- trace model,
- inspector toggle,
- fake `DecisionEngine`.

No real LLM or JEV required yet.

Acceptance:

- one command starts the app,
- a turn produces a stored trace,
- inspector displays it.

## Milestone 2 — real JEV preflight

Outcome: input is classified by real JEV and the route is visible.

Build:

- TypeSafe/JEV adapter,
- batched preflight questions,
- deterministic policy,
- fixtures and contract tests,
- latency/confidence display.

Acceptance:

- raw provider SDK types do not leak into core domain,
- low confidence follows an explicit fallback.

## Milestone 3 — LLM escalation

Outcome: JEV can route a request to a fast or reasoning model class.

Build:

- one LLM provider adapter first,
- model-class mapping in config,
- generation trace,
- bounded context builder.

Acceptance:

- deterministic requests can finish without LLM,
- routed requests show why an LLM was used.

## Milestone 4 — one real tool

Outcome: agent can propose and execute one harmless tool with policy checks.

Suggested tool: local reminder/task creation or a mock external action.

Build:

- typed tool schema,
- proposed-action validation,
- JEV action/risk check,
- approval state,
- execution result trace.

Acceptance:

- invalid proposals cannot execute,
- approval-required actions pause explicitly.

## Milestone 5 — session signal classification

Outcome: after a turn/session, JEV classifies useful signals.

Build:

- memory candidate extractor,
- JEV scope classification,
- persistence for candidate + rationale/metadata,
- inspector section.

Acceptance:

- system distinguishes ephemeral, short-term, retrospective, long-term and discard.

## Milestone 6 — voice spike

Only after the text harness is stable.

Goal: prove that partial/final transcript events can feed the same orchestrator.

Do not redesign the core around one voice provider.

Create a `VoiceInput` adapter that emits normalized transcript events. Provider-specific realtime protocols stay outside core.

## Milestone 7 — cloud deployment

Containerize and deploy the existing app with minimal changes.

Pick the simplest target based on current constraints at that time.

## Explicitly defer

- multi-agent supervisor,
- distributed workflow engine,
- WebMCP integration,
- CopilotKit,
- multiple databases,
- Kafka/EventBridge,
- vector database,
- generalized plugin marketplace,
- multi-cloud abstraction,
- custom auth system,
- background worker fleet.

Introduce any of these only when a concrete demo/use case makes the absence painful.
