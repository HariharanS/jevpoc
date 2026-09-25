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

## Milestone 6A — control-first voice foundation

Outcome: the same JEV harness can process revisable streaming speech without treating every partial transcript as a new agent turn.

Build:

- browser microphone capture,
- WebSocket voice endpoint,
- one streaming STT adapter,
- canonical `SpeechEvent` mapping,
- Transcript Ledger,
- semantic-checkpoint coordinator,
- voice timeline in inspector.

Acceptance:

- partial/final/revised transcripts are visible,
- provider SDK events do not leak into core,
- JEV is invoked at semantic checkpoints, not every token,
- raw audio does not need to be persisted.

## Milestone 6B — correction and commit semantics

Outcome: the demo proves why revision-aware JEV processing is useful.

Use a mixed utterance such as:

```
today I drank 200 ml Coke ... ah no, water,
pick up my parcel at 2,
remind me about medicine,
today is the happiest day ... but I'm sad about letting go of my old car
```

Build:

- draft structured-event candidates,
- soft commit,
- patch/merge behavior,
- correction horizon,
- sealing rules,
- provisional UI.

Acceptance:

- "Coke ... no, water" updates one candidate rather than creating two facts,
- late STT revision and deliberate user correction remain distinguishable,
- transcript finality never directly executes a consequential action.

## Milestone 6C — voice output and interruption

Outcome: the app speaks and handles natural barge-in.

Build:

- one speech-output path,
- response correlation IDs,
- playback streaming,
- interruption/cancel flow,
- interruption telemetry.

Acceptance:

- user speech stops stale assistant output quickly,
- the cancelled response remains visible in trace,
- subsequent speech continues the same session cleanly.

## Milestone 6D — native realtime provider mode

Only after the control-first path is working.

Outcome: compare a native speech-to-speech loop with the STT-first architecture while preserving the same policy/tool boundary.

Build one adapter for a current provider such as OpenAI Realtime, Gemini Live or xAI/Grok Voice.

Build:

- realtime session adapter,
- normalized provider events,
- transcript/output events where available,
- tool-proposal normalization,
- Tool Gateway interception,
- approval/policy integration,
- sideband/telemetry path where supported.

Acceptance:

- provider can converse naturally,
- provider cannot bypass Tool Gateway for consequential actions,
- inspector shows what JEV could see before vs after model processing,
- voice-session model selection remains separate from per-task reasoning routing.

## Milestone 7 — provider comparison spike

Do not implement all providers fully.

Create thin experiments or fixtures to compare the capabilities that matter:

- access to partial/revised transcripts,
- VAD/semantic turn behavior,
- barge-in,
- tool calling,
- async tools,
- client-direct auth,
- output transcripts,
- end-to-end latency,
- observability/control points.

The purpose is to validate the abstraction, not build a provider framework.

## Milestone 8 — cloud deployment

Containerize and deploy the existing app with minimal changes.

Pick the simplest target based on current constraints at that time.

Voice transport may later use direct client-to-provider connections with ephemeral credentials when that materially improves latency, while backend policy/tools/telemetry remain application-owned.

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
- background worker fleet,
- implementing every realtime voice provider before one vertical slice works.

Introduce any of these only when a concrete demo/use case makes the absence painful.
