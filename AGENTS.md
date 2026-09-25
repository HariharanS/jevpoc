# AGENTS.md

This repository is designed to be worked on by multiple AI coding agents and humans.

The repository itself is the durable project memory. Do not assume important reasoning lives only in prior chats.

## First read

Before substantial work:

1. read `docs/README.md` for the project-brain map and status legend;
2. read `docs/15-decision-status-and-open-experiments.md`;
3. read the normative documents relevant to your task;
4. read the dated research snapshot relevant to any provider/framework choice;
5. read applicable ADRs;
6. if implementing Jev/TypeSafe, read docs/17-typesafe-ai-reference.md and the official TypeSafe agent skill;
7. read docs/18-runtime-contracts.md before changing APIs, traces, approvals, loops, fallback or persistence;
8. read docs/19-first-demo-and-evaluation.md and tests/evals before changing question wording or thresholds;
9. read docs/20-ui-ux-design.md before implementing the frontend.

Do not re-research an area from scratch unless the existing research is stale for the implementation question, an API has changed, or observed behavior conflicts with the snapshot.

## Mission

Build the smallest useful JEV-based intent/agent runtime that demonstrates:

1. fast typed decisions with JEV;
2. LLM escalation only when needed;
3. explicit evolving semantic state;
4. revision-aware voice processing;
5. governed tools and human approval;
6. observable execution;
7. session/retro signal classification;
8. local-first development with a clean cloud path.

## Product shape

This is not primarily a chatbot.

The user supplies natural language or voice, the runtime interprets it into typed semantic state, and the UI morphs to match the intent.

Corrections should patch existing semantic events rather than blindly append new chat artifacts.

## Non-goals

Do not turn this into a general-purpose agent framework, distributed system, plugin marketplace, workflow engine, event bus, voice platform, or cloud platform unless a concrete requirement forces it.

## Architectural ownership

The application owns:

- SemanticFrame construction;
- versioned JEV question sets;
- deterministic policy and thresholds;
- SemanticEvent identity/state mutation;
- Tool Gateway;
- approvals;
- durable application state;
- memory write policy;
- trace/event model.

Harnesses/providers may own:

- model invocation;
- model-specific streaming;
- provider session mechanics;
- built-in agent loop features;
- transport.

Provider/framework types must not become the core domain model.

## JEV rules

- JEV outputs are decision signals, not side effects.
- Do not use an LLM merely to decide which routine JEV questions to ask.
- Select a versioned question set from the runtime stage.
- Put objective facts already known to code directly into state.
- Batch independent questions sharing the same state.
- If a later question depends on an earlier answer, update state and make a separate decision call.
- Keep thresholds and action consequences in deterministic policy.
- Add evals for important question families.

Read docs/11-jev-request-modeling.md and docs/17-typesafe-ai-reference.md before changing this behavior.

For TypeSafe/Jev work:

- use/read the official TypeSafe agent skill first;
- use the official @typesafe-ai/sdk inside the adapter;
- keep TypeSafe SDK objects out of core;
- preserve the exact Noul / Choice / Score answer distinctions;
- batch independent questions sharing one state;
- pin a Jev model version for eval runs;
- rerun checked-in fixtures whenever question wording/criteria/thresholds change.

## Voice rules

- Preserve partial/revised/final transcript evidence in the Transcript Ledger.
- Never equate transcript finality with execution permission.
- Do not run a full agent turn for every transcript partial.
- Treat input/event normalization as bookkeeping, not semantic interpretation.
- Use the hybrid Semantic Checkpoint Scheduler to decide **when** to ask JEV; JEV decides **what** the new evidence means.
- Do not add an LLM merely to decide when a checkpoint should occur.
- Distinguish provider/STT revisions from deliberate user semantic corrections.
- Handle barge-in/cancellation as first-class events.
- Keep voice-session provider/model selection separate from per-task reasoning-model routing.
- Identify whether an adapter implements control-first STT/TTS or native realtime speech-to-speech.
- Do not hide those two modes behind a misleading lowest-common-denominator abstraction.
- All consequential native-voice tool proposals still pass through Tool Gateway.

Read `docs/08-voice-architecture.md`, `docs/16-streaming-checkpoint-scheduler.md`, and the current voice-provider research before changing voice behavior.

## Harness rules

The application must retain access to the raw semantic request before committing to the relevant reasoning-model path.

Do not choose a framework solely because a research document mentions it.

Before changing harness strategy, read:

- `docs/10-request-lifecycle-and-harness.md`;
- `docs/research/2026-09-25-harness-framework-evaluation.md`;
- relevant ADRs.

If a spike produces evidence for a durable harness choice, record it rather than silently coupling core code to the framework.

## Semantic state / UI rules

Use a small application-owned mutation vocabulary such as:

- CREATE;
- PATCH;
- MERGE;
- CLOSE;
- CANCEL;
- IGNORE;
- WAIT.

Preserve event identity across corrections.

Do not allow models to generate arbitrary executable frontend code.

The UI should project typed semantic state.

Read `docs/12-semantic-state-and-ui-runtime.md`.

## Tool rules

- Validate schemas before execution.
- Apply hard authentication/authorization before semantic judgments.
- Use JEV only for semantic decisions where code does not already know the exact answer.
- Respect approval policy.
- Use idempotency/correlation for consequential actions.
- Normalize MCP/WebMCP/framework/provider calls into the same Tool Gateway contract.

Read `docs/14-tool-gateway-mcp-webmcp.md`.

## Memory rules

- Work on bounded episodes/candidates rather than dumping every full session into memory.
- JEV may classify memory scope; deterministic code owns persistence.
- Prefer durable repository artifacts for project decisions when appropriate.
- Do not add a vector database until retrieval needs justify one.

Read `docs/13-session-retro-memory.md`.

## Runtime contract rules

The following are already decided and must not be reinvented in Milestone 1:

- traceId exists before semantic processing starts;
- POST run returns 202 + traceId immediately;
- SQLite trace_events is Inspector replay source of truth;
- live SSE uses an in-process TraceBus;
- OpenTelemetry is an operational mirror, not application state;
- Milestones 1-3 are single-pass;
- later tool loops are bounded;
- approval can only follow a concrete validated ToolProposal;
- Jev failure is stage-specific and never causes high-impact actions to fail open;
- memory_signals are read back into later SemanticFrames;
- initial toolchain is pnpm / Node22 / node:sqlite / Biome.

Read docs/18-runtime-contracts.md before changing any of these.

## UI rules

The first frontend is not an unspecified chatbot.

Use docs/20-ui-ux-design.md:

- Input Stream on the left;
- Processing / Control Plane in the middle;
- typed Intent Canvas on the right;
- collapsible Inspector timeline below;
- ChatGPT/Grok-style provider-neutral voice orb;
- App/Lab runtime toggle;
- SemanticEvent IDs remain stable while cards PATCH in place.

Build the simulated text/transcript flow before polishing microphone animation.

## Evaluation rules

The architecture is a hypothesis.

Before claiming it works:

- compare with the LLM-first baseline;
- use checked-in tests/evals fixtures;
- record semantic accuracy, correction PATCH accuracy, duplicate-event rate, LLM skip rate, latency and cost;
- do not edit expected labels just to make Jev pass.

Read docs/19-first-demo-and-evaluation.md.

## Engineering rules

- Prefer one process and one deployable unit initially.
- Prefer plain TypeScript functions and interfaces over framework-specific abstractions.
- Keep domain logic independent from HTTP, UI, model SDKs, voice SDKs, databases and cloud services.
- Introduce an abstraction only when it creates a clear seam or serves real implementations.
- Every volatile external dependency sits behind a small adapter.
- No hidden agent state. Persist meaningful state explicitly.
- Add tests for behavior, not implementation details.
- Avoid speculative queues, microservices, caches and distributed locks.

## Research rules

A file under `docs/research/` is evidence/reference, **not automatically an implementation instruction**.

When significant new research is required:

- date it;
- preserve source links;
- distinguish external facts from project interpretation;
- update normative docs only if the chosen design changes;
- add/update an ADR for durable cross-cutting changes.

## Working agreement

Before making a change:

- state the user-visible outcome;
- identify the smallest vertical slice that proves it;
- identify the normative contract being implemented;
- list files expected to change;
- call out any research assumption that is being promoted into implementation.

When finishing:

- run tests/typecheck/lint;
- update relevant eval fixtures;
- update docs if architecture or behavior changed;
- add/update an ADR only for a durable architectural decision;
- leave a short handoff note describing outcome, decisions, tests, gaps and next useful task.

## Definition of done

A change is done when it is runnable locally, testable, observable enough to diagnose, consistent with the normative project docs, and does not introduce infrastructure or framework coupling that the current use case does not require.
