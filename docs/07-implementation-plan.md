# Implementation plan

> **Status:** Normative build sequence
> **First product demo:** Live Intent Workspace
> **Read with:** docs/18-runtime-contracts.md, docs/19-first-demo-and-evaluation.md, docs/20-ui-ux-design.md

Build thin vertical slices. Stop after each milestone and prove the behavior before expanding the architecture.

## Locked engineering setup

Do not debate these during Milestone 1:

~~~text
pnpm workspaces
Node.js 22+
TypeScript
React + Vite
Fastify
Zod
node:sqlite + plain SQL
Vitest
Biome
OpenTelemetry
SSE for Inspector
WebSocket for server-mediated voice
~~~

## First demo behavior

Use the mixed-intent/correction scenario as the north star:

~~~text
today I drank 200 ml Coke
ah no I mean water
pick up my Australia Post parcel at 2pm
remind me to take my medicine
today is the happiest day of my life because my dream car arrived
but I am sad about letting my old car go
~~~

The runtime should end with:

- one hydration event: 200 ml Water;
- one parcel task: 2pm;
- one reminder draft: missing time;
- one journal/reflection event;
- visible evidence that Coke was PATCHed to Water rather than duplicated.

Do not make model routing itself the primary demo.

## Milestone 0 — workspace and contracts

Outcome: the repository can be cloned and built consistently by a human or coding agent.

Build:

- pnpm workspace;
- apps/web;
- apps/api;
- packages/core;
- Biome config;
- TypeScript configs;
- Vitest config;
- environment example;
- SQLite bootstrap/migrations script;
- core type files matching docs/02 and docs/18.

Acceptance:

- pnpm install;
- pnpm dev;
- pnpm test;
- pnpm lint;
- pnpm typecheck;

all work on a clean machine.

No external AI key is required yet.

## Milestone 1 — text-first walking skeleton

Outcome:

> replay the first demo as text/simulated chunks and visibly create/PATCH typed cards with a complete live trace.

Build:

- three-column Lab UI from docs/20;
- App/Lab toggle;
- text composer;
- simulated transcript/chunk fixture player;
- SessionState + SemanticEvent store;
- SQLite trace_events;
- in-process TraceBus;
- POST run -> immediate traceId;
- SSE live Inspector;
- FakeDecisionEngine;
- deterministic policy;
- Hydration/Task/Reminder/Journal/Generic cards.

FakeDecisionEngine must use the same Noul/Choice/Score answer union as the real TypeSafe adapter.

Acceptance:

- one command starts web + API;
- mixed-intent fixture creates the expected cards;
- correction fixture PATCHes the same hydration event ID;
- Inspector subscribes before run completion;
- SQLite can replay the trace after refresh;
- no LLM or TypeSafe API is required;
- no raw audio exists yet.

This milestone proves the application/state/trace architecture independently of AI vendors.

## Milestone 2 — real TypeSafe / Jev

Outcome:

> replace the fake semantic decisions with the real Jev adapter and benchmark decision quality.

Build:

- official @typesafe-ai/sdk adapter;
- TYPESAFE_API_KEY configuration;
- pinned Jev model config for eval runs;
- question registry:
  - pre_turn_v1;
  - voice_semantic_update_v1;
- typed answer normalization;
- Jev usage/latency trace events;
- explicit unavailable/rate-limit fallback;
- fixture runner;
- first benchmark report.

Before coding Jev integration, the coding agent must read/use the TypeSafe agent skill described in docs/17-typesafe-ai-reference.md.

Acceptance:

- provider SDK types do not leak into packages/core;
- independent questions sharing one state are batched;
- Noul is handled as probability, not generic confidence;
- checked-in seed fixtures run;
- grow the suite toward >=50 reviewed decision fixtures before making POC performance claims;
- model version, latency, usage and fallback are visible in Inspector.

## Milestone 3 — LLM baseline and escalation

Outcome:

> the POC can prove when Jev avoids a general-purpose LLM and compare itself with a simpler LLM-first architecture.

Build:

- OpenAI LanguageModel adapter behind application port;
- configured model ID via env;
- structured semantic-extraction baseline;
- route:
  - deterministic/semantic path;
  - fast LLM;
  - reasoning LLM;
  - wait/clarify;
- LLM traces/tokens/cost;
- baseline benchmark runner.

Milestones 1-3 remain single-pass per semantic input. Do not add an autonomous loop.

Acceptance:

- bounded decisions can finish without LLM;
- open-ended fixture routes to LLM;
- same fixture suite can compare Jev path vs LLM-first;
- benchmark report includes quality, latency, call count and cost;
- no claim of superiority is made without measured evidence.

See docs/19-first-demo-and-evaluation.md.

## Milestone 4 — one governed tool + approval

Outcome:

> a real proposed action can be validated, approved if needed, executed once, and resumed safely.

Use one harmless/reversible first tool, such as local reminder/task creation.

Build:

- ToolDefinition registry;
- provider-native tool proposal normalization;
- ToolGateway;
- tool_calls table;
- Approval table/state machine;
- demo identity selector;
- self-approval flow;
- approval UI card;
- POST approval decision endpoint;
- bounded tool step loop.

Defaults:

~~~text
maxSteps = 4
maxToolCalls = 3
~~~

Acceptance:

- approval only exists after a concrete validated ToolProposal;
- invalid proposals cannot execute;
- duplicate/idempotent execution is prevented;
- awaiting approval pauses the run;
- approving resumes from tool execution, not by blindly replaying the original prompt;
- Jev unavailable never causes consequential action to fail open;
- complete lifecycle is visible in Inspector.

Family-role approval is a later demo variation, not a blocker for this milestone.

## Milestone 5 — session signal classification + readback

Outcome:

> useful session signals can be classified, persisted, and actually influence a later semantic frame.

Build:

- deterministic episode/candidate extraction from structured trace/state events;
- Jev memory-scope question set;
- memory_candidates;
- memory_signals;
- deterministic readback into SemanticFrame;
- duplicate/supersession behavior;
- Inspector memory view.

Initial retrieval only:

- current-session short-term signals;
- explicit kind/key long-term matches;
- small recent domain-relevant set.

No vector DB.

Acceptance:

- runtime can demonstrate a later run receiving an earlier persisted signal;
- memory classification remains Jev signal + deterministic persistence policy;
- candidate extraction is not an unspecified hidden LLM;
- old/superseded signals do not silently overwrite newer accepted state.

## Milestone 6A — control-first voice foundation

Outcome:

> replace simulated transcript chunks with real streaming speech while preserving the same semantic runtime.

Build:

- browser microphone capture;
- one STT provider adapter selected by spike;
- canonical SpeechEvent mapping;
- Transcript Ledger;
- hybrid Semantic Checkpoint Scheduler;
- voice orb states;
- raw transcript + revision lane;
- voice timeline in Inspector.

Provider spike shortlist and benchmark are documented in:
docs/research/2026-09-25-voice-api-capability-matrix.md

Acceptance:

- partial/final/revised evidence is visible;
- provider event types do not leak into core;
- Jev is invoked at checkpoints, not every token;
- long continuous/yapping speech produces bounded checkpoints;
- raw microphone audio is not persisted by default;
- same text-first semantic fixtures can be replayed as simulated voice evidence.

## Milestone 6B — correction and commit semantics over real voice

Outcome:

> prove the Coke -> Water case and multi-intent state evolution from actual speech.

Build/tune:

- draft;
- soft commit;
- patch/merge;
- correction horizon;
- seal;
- scheduler thresholds/hysteresis;
- missing-information behavior.

Acceptance:

- explicit correction patches intended event;
- provider STT revision remains distinguishable from deliberate user correction;
- medicine reminder can remain draft without interrupting the user mid-yap;
- transcript finality does not authorize an external action;
- checkpoint metrics are recorded.

## Milestone 6C — voice output and interruption

Outcome:

> the application speaks and handles natural barge-in.

Build:

- one TTS/speech-output adapter;
- output response IDs;
- streamed playback;
- user barge-in/cancel;
- interruption trace.

Acceptance:

- stale assistant audio stops quickly on user speech;
- interrupted response is visible in trace;
- subsequent user speech continues the same session cleanly.

## Milestone 6D — native realtime comparison

Only after control-first semantics work.

Outcome:

> compare one native speech-to-speech provider while preserving application-owned Tool Gateway, state and telemetry.

Shortlist:

- OpenAI Realtime;
- Gemini Live;
- xAI Speech-to-Speech.

Build one adapter only.

Acceptance:

- provider can converse naturally;
- consequential tools cannot bypass Tool Gateway;
- Inspector makes clear what the provider heard before Jev could act;
- backend reasoning may use a different model from the voice session;
- result is compared with control-first path instead of replacing it by assumption.

## Milestone 7 — provider / scheduler benchmark

Use the same utterance scripts across candidate STT providers and scheduler variants.

Compare:

- final-only Jev;
- hybrid checkpoint + Jev;
- LLM-first;
- selected STT providers.

Measure:

- first partial latency;
- stable/final latency;
- turn-boundary quality;
- checkpoint count;
- Jev calls;
- correction evidence preserved;
- semantic accuracy;
- duplicate events;
- cost;
- implementation complexity.

Do not integrate every provider.

## Milestone 8 — simple cloud deployment

Containerize and deploy with minimal application changes.

Select the host at that time based on operational simplicity.

Cloud migration should mostly change:

- deployment config;
- persistence adapter if SQLite is no longer appropriate;
- secret/auth setup;
- telemetry export;
- voice transport details.

It should not rewrite SemanticFrame, Jev question sets, policy, SemanticEvent or ToolGateway contracts.

## Explicitly defer

Until a concrete requirement appears:

- generalized multi-agent supervisor;
- distributed workflow engine;
- WebMCP as foundational runtime;
- CopilotKit as mandatory UI;
- vector DB;
- Kafka/EventBridge;
- microservices;
- generalized plugin marketplace;
- multi-cloud abstraction;
- worker fleet;
- every voice provider;
- arbitrary generated executable frontend code.

## Build-agent rule

At the start of each milestone, an AI coding agent must:

1. read AGENTS.md and docs/README.md;
2. read docs/18-runtime-contracts.md;
3. read the milestone-specific normative docs;
4. read relevant dated research instead of restarting from scratch;
5. inspect tests/evals;
6. state the smallest vertical outcome before coding.

A milestone is done only when its behavior can be demonstrated in the UI/Inspector and tested from fixtures.
