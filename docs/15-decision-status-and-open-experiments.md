# Decision status and open experiments

> **Status:** Normative planning reference
> **Last updated:** 2026-09-25

This file answers:

> What should an implementation agent build, what is already decided, what still needs a spike, and what should it leave alone?

## First demo is decided

Build:

> **Live Intent Workspace — text-first mixed-intent/correction, then the same semantic runtime over streaming voice.**

Reference:
- docs/19-first-demo-and-evaluation.md
- docs/examples/01-mixed-utterance-end-to-end.md
- docs/20-ui-ux-design.md

Model routing is a supporting capability/baseline, not the primary demo.

## Implement — decisions are made

| Area | Current direction | Evidence/design |
|---|---|---|
| Product | Live intent workspace; language -> semantic state -> UI | 09, 19 |
| Core runtime | Application-owned thin semantic/Jev/policy layer | 01, 10, ADR 0002 |
| TypeSafe/Jev | Hosted API via official @typesafe-ai/sdk behind DecisionEngine | 17, 18 |
| Jev inputs | Bounded SemanticFrame + versioned question registry | 11, 17 |
| Decision answers | Typed Noul / Choice / Score union | 17, 18, 02 |
| First demo | Mixed-intent correction scenario, text then voice | 19, examples/01 |
| State | Stable SemanticEvent IDs + CREATE/PATCH/MERGE/SEAL | 12, 18 |
| UI | Three-column Lab UI + App mode + Inspector drawer | 20 |
| Tools | Provider-neutral Tool Gateway | 14, 18 |
| Approvals | Only after validated ToolProposal; persisted pause/resume | 14, 18 |
| Persistence | node:sqlite + plain SQL locally | 02, 18, ADR 0001 |
| Trace | SQLite trace_events source of truth + TraceBus + OTel mirror | 04, 18 |
| Live Inspector | POST returns traceId immediately; SSE follows live trace | 04, 18 |
| Voice semantic model | Transcript Ledger + hybrid Checkpoint Scheduler + Jev | 08, 16 |
| Memory | Structured candidate extraction + Jev classification + deterministic readback | 13, 18 |
| LLM baseline | OpenAI JS SDK behind LanguageModel; model ID configured | 18, 19 |
| Tooling | pnpm, Node22, TypeScript, React/Vite, Fastify, Zod, Vitest, Biome | 02, 18 |
| Privacy | Redaction/no raw audio persistence from Milestone 1 | 04, 18 |
| Eval | JSONL fixtures + LLM-first baseline + benchmark report | 19, tests/evals |

## Implement as a vertical slice

First useful proof:

~~~text
simulated incremental text
   -> SemanticFrame
   -> FakeDecisionEngine
   -> deterministic policy
   -> SemanticEvent CREATE/PATCH
   -> three-column Lab UI
   -> SQLite + live Inspector trace
~~~

Then:

~~~text
FakeDecisionEngine
   -> TypeSafeDecisionEngine
   -> fixture benchmark
   -> LLM baseline/escalation
   -> one governed tool
   -> memory readback
   -> real streaming voice
~~~

Do not build a generalized harness first.

## TypeSafe/Jev is no longer ambiguous

Concrete integration is documented in docs/17-typesafe-ai-reference.md.

Implementation assumptions:

~~~text
SDK:       @typesafe-ai/sdk
auth:      TYPESAFE_API_KEY
model:     configured; pin version for evals
input:     JSON/text state + typed questions
output:    Noul / Choice / Score answers
batching:  independent questions sharing state in one request
behavior:  probabilistic; thresholds calibrated from fixtures
~~~

AI coding agents working on Jev should read/use the official TypeSafe agent skill before modifying the adapter/question sets.

## Turn/loop behavior is decided

### Milestones 1-3

One semantic checkpoint/run is bounded single-pass.

No autonomous loop.

### Milestone 4+

Tool-capable path is bounded:

~~~text
maxSteps = 4
maxToolCalls = 3
~~~

Terminal states include:

- completed;
- needs clarification;
- awaiting approval;
- denied;
- degraded/failure;
- step limit reached.

No unbounded agent loop.

## Jev unavailable behavior is decided

Stage-specific fallback:

- semantic/pre-turn -> configured baseline LLM classifier if available; otherwise WAIT/clarify;
- consequential tool gating -> fail safe; approval/deny, never fail open;
- completion -> respect step bound and return degraded/clarification rather than loop forever.

All fallback use is traced.

## Spike before selecting

These are genuine implementation/provider choices, not missing architecture.

### Harness

Question:

> Which existing harness minimizes our code while preserving raw-request/Jev/model/tool control?

Candidates already researched:

- thin own orchestrator + provider SDK;
- Microsoft Agent Framework;
- GitHub Copilot SDK behind our pre-turn layer;
- LangChain/LangGraph;
- Strands.

Success criteria:

- raw semantic input visible before relevant reasoning-model selection;
- model class selectable before call;
- Tool Gateway interception;
- cancellation;
- usable event/telemetry hooks;
- less complexity than reproducing the framework ourselves.

Milestones 0-2 do **not** require a permanent harness choice.

### Checkpoint scheduler thresholds

Architecture is chosen; tuning is not.

Compare:

- final-transcript-only;
- hybrid checkpoint + Jev;
- LLM-first structured extraction.

Measure:
- checkpoints/Jev calls per minute;
- useful-state latency;
- UI flapping;
- correction accuracy;
- long yapping behavior;
- cost.

### Control-first STT provider

Research shortlist:

- Deepgram Flux;
- Gemini Live Transcription;
- xAI Streaming STT or OpenAI Realtime Transcription.

See:
docs/research/2026-09-25-voice-api-capability-matrix.md

Choose one first adapter from measured evidence, not marketing.

### Native realtime provider

Only after control-first semantic behavior works.

Shortlist:

- OpenAI Realtime;
- Gemini Live;
- xAI Speech-to-Speech.

The native provider does not replace application-owned Tool Gateway/state/policy.

### AG-UI / CopilotKit

Adopt only if a spike proves a concrete reduction in:

- agent event plumbing;
- human approval UI;
- structured/generative UI.

SemanticEvent and Tool Gateway stay application-owned.

### Cloud

Choose only for the first deployed demo.

Compare operational simplicity, not theoretical maximum scale.

## Research later

Worth investigating after the first evidence-driven POC:

- large tool-catalog activation vs prompt-cache behavior;
- Jev context prefetch/relevance;
- session-retro automatic artifact suggestions;
- richer provider/model capability registry;
- API Journey Compiler retrieval/evidence pipeline;
- WebMCP browser adapter;
- smarter memory retrieval;
- managed full voice-agent platforms vs our control-first design.

## Explicitly deferred

Unless a concrete requirement appears, do not introduce:

- generalized multi-agent supervisor;
- distributed workflow engine;
- Durable Objects as mandatory session architecture;
- Convex as mandatory backend;
- Step Functions as orchestration backbone;
- Kafka/EventBridge/event bus;
- microservices;
- vector DB;
- generalized skill/plugin marketplace;
- multi-cloud abstraction;
- background worker fleet;
- every voice provider simultaneously;
- arbitrary LLM-generated executable frontend code.

## What proves the idea

The architecture is a hypothesis, not the result.

The POC should report:

- semantic fixture accuracy;
- correction/PATCH accuracy;
- duplicate-event rate;
- LLM skip rate;
- latency;
- input cost;
- number of calls;
- UI stability;
- provider/checkpoint behavior.

Compare Jev control plane to the LLM-first baseline.

See docs/19-first-demo-and-evaluation.md.

## How to change status

If a spike produces evidence that changes a chosen direction:

1. preserve the result under docs/research or docs/evals;
2. update this status file;
3. update relevant normative docs;
4. add/update an ADR for durable cross-cutting change;
5. update fixtures/tests that encode old behavior.

Do not change architecture by silently introducing a library in an implementation PR.
