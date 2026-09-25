# AGENTS.md

This repository is designed to be worked on by multiple AI coding agents and humans.

## Mission

Build the smallest useful JEV-based agent harness that demonstrates:

1. fast typed decisions with JEV,
2. LLM escalation only when needed,
3. explicit state and action handling,
4. revision-aware voice processing,
5. observable execution,
6. local-first development with a clean path to cloud deployment.

## Non-goals

Do not turn this into a general-purpose agent framework, distributed system, plugin marketplace, workflow engine, event bus, voice platform, or cloud platform unless a concrete requirement forces it.

## Engineering rules

- Prefer one process and one deployable unit initially.
- Prefer plain TypeScript functions and interfaces over framework-specific abstractions.
- Keep domain logic independent from HTTP, UI, model SDKs, voice SDKs, databases and cloud services.
- Introduce an abstraction only when there are at least two real implementations or a clear test seam.
- Every external dependency sits behind a small adapter.
- No hidden agent state. Persist meaningful session state explicitly.
- Consequential actions require an explicit policy decision and, where configured, human approval.
- JEV outputs are advisory decision signals. Application code applies thresholds and owns the action.
- LLMs/voice models may propose; deterministic code validates and executes.
- For voice, preserve partial/revised/final transcript evidence in the Transcript Ledger.
- Never equate transcript finality with execution permission.
- Do not run a full agent turn for every partial transcript.
- Distinguish STT/provider corrections from deliberate user semantic corrections.
- Handle barge-in/cancellation as first-class events.
- Keep voice-session provider/model selection separate from per-task reasoning-model routing.
- Add tests for behavior, not implementation details.
- Avoid speculative queues, microservices, caches and distributed locks.

## Before coding

Read in this order:

1. `docs/00-product-intent.md`
2. `docs/01-system-design.md`
3. `docs/02-technical-design.md`
4. `docs/03-jev-decision-model.md`
5. `docs/04-observability.md`
6. `docs/05-local-to-cloud.md`
7. `docs/06-agent-collaboration.md`
8. `docs/07-implementation-plan.md`
9. `docs/08-voice-architecture.md`

Also read ADRs under `docs/adr/`, especially ADR 0004 before changing voice behavior.

## Voice-specific working rule

When adding a provider adapter, first identify which mode it serves:

- control-first STT/TTS; or
- native realtime speech-to-speech.

Do not hide the difference behind a fake common abstraction.

Core code consumes canonical events/capabilities, while transport/session/event details stay inside the provider adapter.

All consequential tool calls proposed by a native realtime provider must still pass through the application's Tool Gateway and policy.

## Working agreement for agents

Before making a change:

- state the user-visible outcome,
- identify the smallest slice that proves it,
- list files expected to change,
- preserve existing interfaces unless the task requires changing them.

When finishing:

- run tests/typecheck/lint,
- update docs if architecture or behavior changed,
- add or update an ADR only for a durable architectural decision,
- leave a short handoff note in the PR describing what changed, what remains, and any assumptions.

## Definition of done

A change is done when it is runnable locally, testable, observable enough to diagnose, documented where necessary, and does not introduce infrastructure that the current use case does not require.
